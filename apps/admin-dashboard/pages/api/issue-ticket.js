import isEmpty from 'lodash/isEmpty';
import supabase from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';

    const bearerToken = `${authHeader.replace('Bearer ', '')}`;

    const { user, error: authError } = await supabase.auth.api.getUser(bearerToken);

    if (authError) return res.status(401).json({ error: authError.message });

    supabase.auth.session = () => ({
      access_token: bearerToken,
      token_type: "",
      user,
    });

    const body = req.body;

    if (isEmpty(body)) {
      return res.status(500).json({ error: 'Empty body not allowed' });
    }

    const { user_uuid } = body;

    if (!user_uuid) {
      return res.status(500).json({ error: 'Missing user_uuid in request body' });
    }

    const { error: updateError } = await supabase.from('registered-users').update({
      ticket_issued: true,
    }).eq('uuid', user_uuid);

    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.status(200).json({ message: 'Successfully issued the ticket' });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
