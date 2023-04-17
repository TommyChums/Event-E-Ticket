import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import isEmpty from 'lodash/isEmpty';
import canUseAdminApi from '../../../lib/api/canUseAdminApi';

const auththenticatedSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });

  if (req.method === 'POST') {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user || !canUseAdminApi(session.user)) {
      return res.status(401).json({ error: authError.message });
    }

    const body = req.body;

    if (isEmpty(body)) {
      return res.status(500).json({ error: 'Empty body not allowed' });
    }

    const { user_id, attributes } = body;

    if (!user_id) {
      return res.status(500).json({ error: 'Missing user_id in request body' });
    }

    if (!attributes) {
      return res.status(500).json({ error: 'Missing attributes in request body' });
    }

    const { data: { user }, error } = await auththenticatedSupabase.auth.admin.updateUserById(user_id, attributes);

    if (error) {
      return res.status(500).json({ error: 'Error updating the user' });
    }

    return res.status(200).json({ message: 'Successfully updated the user', user });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
