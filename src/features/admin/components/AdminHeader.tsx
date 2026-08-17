import { Chip } from "@heroui/react";
import { ShieldAlert } from "lucide-react";

export function AdminHeader() {
	return (
		<div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
			<div className="text-left">
				<Chip
					className="mb-4 h-8 px-4 font-black tracking-widest uppercase"
					color="danger"
					variant="soft"
				>
					<ShieldAlert className="h-4 w-4 mr-2 inline" />
					Admin Terminal
				</Chip>
				<h1 className="text-4xl lg:text-5xl font-serif font-bold text-text-primary mb-3">System Control Center</h1>
				<p className="text-lg text-text-secondary font-medium max-w-2xl">
					You are in high-privilege mode. Monitor performance, manage users, and configure core system settings.
				</p>
			</div>
		</div>
	);
}
