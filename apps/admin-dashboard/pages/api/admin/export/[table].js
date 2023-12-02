import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import xlsx from 'json-as-xlsx';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import startCase from 'lodash/startCase';
import moment from 'moment';
import sendEmail from '../../../../lib/api/sendEmail';

const TABLE_CONFIG = {
  registrations: {
    name: 'registered-users',
    eventFilter: { prop: 'eq', column: 'registered_event' },
    select: '*'
  },
  payments: {
    name: 'registered-user-payments',
    eventFilter: { prop: 'eq', column: 'user.registered_event' },
    select: '*, user:registered-users!inner(*)'
  }
};

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return res.status(401).json({ error: authError.message });
  }

  const body = req.body;
  const query = req.query;

  if (isEmpty(body)) {
    return res.status(500).json({ error: 'Empty body not allowed' });
  }

  const { columns = [], event: eventUuid, type = 'csv' } = body;
  const { table } = query;

  if (!['xlsx', 'csv'].includes(type)) {
    return res.status(500).json({ error: 'Can only export as an excel or csv file' });
  }

  if (!columns || !columns.length) {
    return res.status(500).json({ error: 'Cannot create export file with no columns' });
  }

  const { data: currentEvent, error: selectEventError } = await supabase.from('events')
    .select('uuid, name, event_id').eq('uuid', eventUuid).single();

  if (!currentEvent || selectEventError) {
    return res.status(500).json({ error: 'Error finding event' });
  }

  // TODO: Confirm the logged in user has access to the event

  const tableConfig = TABLE_CONFIG[table];

  if (!tableConfig) {
    return res.status(500).json({ error: 'Invalid table' });
  }

  const {
    name,
    select,
    eventFilter: {
      prop,
      column
    }
  } = tableConfig;

  const { data: tableData, error: selectError } = await supabase.from(name)
    .select(select)[prop](column, eventUuid);

  if (selectError) {
    return res.status(500).json({ error: selectError.message });
  }

  const exportData = [
    {
      sheet: startCase(table),
      columns: columns.map((column) => ({
        label: column.label,
        value: column.id,
      })),
      content: tableData.map((user) => columns.reduce((next, column) => {
        next[column.id] = get(user, column.id);
        return next;
      }, {})),
    },
  ]

  const fileName = `${currentEvent.name}-${table}-export-${moment().format('YYYY-MM-DD')}`;
  
  const settings = {
    fileName: fileName,
    extraLength: 3,
    writeOptions: {
      type: 'buffer',
      bookType: type || 'xlsx',
    },
  };
  
  const fileBuffer = xlsx(exportData, settings);

  const contentType = type === 'xlsx'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv';

  const { error } = await sendEmail({
    to: session.user.email,
    subject: `${startCase(table)} Export for ${currentEvent.name}`,
    text: 'Here is your requested export',
    attachments: [
      {
        fileName: `${table}-export.${type}`,
        content: fileBuffer,
        // headers: {
        //   'Content-Type': contentType,
        //   'Content-Disposition': `attachment;filename="${fileName}.${type}`
        // },
        raw: `Content-Type: ${contentType}\r\nContent-Disposition: attachment;filename="${fileName}.${type}"\r\n
        \r\n
        ${fileBuffer}
        `
      }
    ]
  });

  if (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ message: 'Success' });
};
