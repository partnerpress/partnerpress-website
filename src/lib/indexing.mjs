// Decides whether search engines may index this build.
//
// Builds are noindex unless SITE_INDEXABLE=true. Set it in the Cloudflare Worker's
// build variables once partnerpress.net points at the Worker. Cloudflare Workers
// Builds sets WORKERS_CI_BRANCH, so preview builds of other branches always stay
// noindex, even with the variable set. The workers.dev address gets its own
// noindex header in public/_headers.

export const LIVE_HOST = 'partnerpress.net';
export const PRODUCTION_BRANCH = 'main';

export function isIndexable(env = process.env) {
  const override = (env.SITE_INDEXABLE ?? '').trim().toLowerCase();
  if (!['true', '1', 'yes'].includes(override)) return false;

  const branch = env.WORKERS_CI_BRANCH;
  return !branch || branch === PRODUCTION_BRANCH;
}
