import { createTRPCRouter } from "./init";
import { adminAccountsRouter } from "./routers/admin-accounts.router";
import { adminCsmRouter } from "./routers/admin-csm.router";
import { adminPermissionsRouter } from "./routers/admin-permissions.router";
import { authSignupRouter } from "./routers/auth-signup.router";
import { commentRouter } from "./routers/comment.router";
import { csmRouter } from "./routers/csm.router";
import { postRouter } from "./routers/post.router";
import { profileRouter } from "./routers/profile.router";
import { requestRouter } from "./routers/request.router";
import { uploadRouter } from "./routers/upload.router";
import { userRouter } from "./routers/user.router";

export const trpcRouter = createTRPCRouter({
	user: userRouter,
	adminAccounts: adminAccountsRouter,
	adminCsm: adminCsmRouter,
	adminPermissions: adminPermissionsRouter,
	authSignup: authSignupRouter,
	comment: commentRouter,
	csm: csmRouter,
	post: postRouter,
	profile: profileRouter,
	request: requestRouter,
	upload: uploadRouter,
});

export type TRPCRouter = typeof trpcRouter;
