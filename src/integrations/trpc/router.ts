import { createTRPCRouter } from "./init";
import { adminRouter } from "./routers/admin.router";
import { postRouter } from "./routers/post.router";
import { requestRouter } from "./routers/request.router";
import { uploadRouter } from "./routers/upload.router";
import { userRouter } from "./routers/user.router";

export const trpcRouter = createTRPCRouter({
	user: userRouter,
	admin: adminRouter,
	post: postRouter,
	request: requestRouter,
	upload: uploadRouter,
});

export type TRPCRouter = typeof trpcRouter;
