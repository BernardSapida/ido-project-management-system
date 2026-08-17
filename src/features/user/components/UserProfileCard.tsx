import { Avatar, Card } from "@heroui/react";
import type { User } from "@/types/auth.types";

interface UserProfileCardProps {
	user: User;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
	const initials = [user.firstname?.charAt(0), user.lastname?.charAt(0)].filter(Boolean).join("").toUpperCase() || "U";

	const isVerified = user.emailVerified;

	return (
		<Card className="p-8 w-full flex flex-col items-center border-none shadow-none">
			<Card.Content className="p-0 flex flex-col items-center w-full text-center">
				<div className="mb-6">
					<Avatar className="h-32 w-32 rounded-3xl">
						<Avatar.Fallback className="text-3xl font-serif text-app-brand bg-app-brand/10">{initials}</Avatar.Fallback>
					</Avatar>
				</div>
				<h3 className="text-xl font-bold text-text-primary">
					{user.firstname} {user.lastname}
				</h3>
				<p className="text-sm font-medium text-text-secondary mt-1 tracking-tight">{user.email}</p>

				<div className="mt-8 pt-8 border-t border-text-primary/5 w-full flex flex-col gap-3 text-left">
					<div className="flex justify-between items-center px-1">
						<span className="text-[10px] font-black text-text-secondary/60 uppercase tracking-[0.2em]">Role</span>
						<span className="text-[10px] font-bold text-app-brand bg-app-brand/10 px-2 py-1 rounded-md uppercase tracking-wider">
							{user.role}
						</span>
					</div>
					<div className="flex justify-between items-center px-1">
						<span className="text-[10px] font-black text-text-secondary/60 uppercase tracking-[0.2em]">Status</span>
						{isVerified ? (
							<span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md uppercase tracking-wider">
								Verified
							</span>
						) : (
							<span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md uppercase tracking-wider">
								Unverified
							</span>
						)}
					</div>
				</div>
			</Card.Content>
		</Card>
	);
}
