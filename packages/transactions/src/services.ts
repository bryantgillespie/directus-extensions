/** Services that must not be invoked — lack internal accountability checks or are internal-only */
export const BLOCKED_SERVICES = new Set([
	'AuthenticationService',
	'MailService',
	'TFAService',
	'ExtensionsService',
	'WebSocketService',
	'PayloadService',
	'GraphQLService',
	'ServerService',
	'DeploymentService',
	'DeploymentProjectsService',
	'DeploymentRunsService',
]);

/** Services whose constructor takes (collection, options) instead of just (options) */
export const COLLECTION_SERVICES = new Set([
	'ItemsService',
]);

/** Services that mutate the schema — trigger schema refresh after execution */
export const SCHEMA_MUTATING_SERVICES = new Set([
	'CollectionsService',
	'FieldsService',
	'RelationsService',
]);
