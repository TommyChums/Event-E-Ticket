const canUseAdminApi = (user) => user.app_metadata.claims_admin || user.app_metadata.role === 'admin';

export default canUseAdminApi;
