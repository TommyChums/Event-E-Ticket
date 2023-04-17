import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import keyBy from 'lodash/keyBy';
import map from 'lodash/map';
import canUseAdminApi from '../../../lib/api/canUseAdminApi';

const auththenticatedSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });

  if (req.method === 'GET') {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user || !canUseAdminApi(session.user)) {
      return res.status(401).json({ error: authError.message });
    }

    
    const { data: { users }, error } = await auththenticatedSupabase.auth.admin.listUsers();

    if (error) {
      return res.status(500).json({ error: 'Error retrieving the admin users' });
    }

    const { data: events } = await supabase.from('events').select('event_id, name');

    const eventsById = keyBy(events, 'event_id');

    const adminUsers = [];

    forEach(users, (user) => {
      const { app_metadata } = user;

      // Don't return the current user
      if (user.id !== session.user.id) {
        if (!isEmpty(app_metadata.allowed_events)) {
          if (user.app_metadata.role === 'admin') {
            user.app_metadata.allowed_events_names = [ 'All' ];
          } else {
            user.app_metadata.allowed_events_names = map(app_metadata.allowed_events, (eventId) => (
              eventsById[eventId]?.name
            ));
          }
        }
  
        adminUsers.push(user);
      }
    });

    return res.status(200).json({ message: 'Successfully retrieved admin users', users: adminUsers, eventsById });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
