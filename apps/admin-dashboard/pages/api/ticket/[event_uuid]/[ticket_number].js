import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import isNan from 'lodash/isNaN';

import generateTicketImage from '../../../../lib/api/generateTicketImage';

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });

  if (req.method === 'GET') {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: authError.message });
    }

    const query = req.query;

    const { event_uuid, ticket_number } = query;

    if (isNan(+ticket_number)) {
      return res.status(500).json({ error: 'Invalid Ticket Number' });
    }

    const { data: registeredUser, error: selectError } = await supabase.from('registered-users')
      .select('*, event:events(*)').eq('registered_event', event_uuid).eq('ticket_number', +ticket_number).single();

    if (selectError) {
      console.log(selectError.message)
      return res.status(500).send('Could not find ticket');
    }

    const { ticket } = await generateTicketImage(registeredUser, supabase);

    res.setHeader('Content-Type', 'image/png')
    return res.status(200).send(ticket);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
