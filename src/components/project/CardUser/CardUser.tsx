import { Avatar, Card, Dropdown, Label } from "@heroui/react";
import { ChevronRight, LogOut } from "lucide-react";

interface CardUserProps {
	onLogout: () => void;
	user: { email: string; name: string };
}

export function CardUser({ onLogout, user }: CardUserProps) {
	return (
		<Dropdown className="max-w-30">
			<Dropdown.Trigger>
				<Card>
					<Card.Content>
						<div className="flex flex-row items-center justify-start gap-4 p-0 w-full">
							<Avatar size="md">
								<Avatar.Fallback className="bg-app-brand/10 text-app-brand font-bold">
									{user.name?.charAt(0)}
								</Avatar.Fallback>
							</Avatar>
							<div className="flex flex-col text-left w-30">
								<span className="font-bold truncate text-xs">{user.name}</span>
								<span className="text-xs font-medium truncate">{user.email}</span>
							</div>
							<ChevronRight className="ml-auto h-4 w-4 group-hover:transition-all" />
						</div>
					</Card.Content>
				</Card>
			</Dropdown.Trigger>
			<Dropdown.Popover className="bg-app-base shadow-2xl rounded-2xl">
				<Dropdown.Menu className="p-2">
					<Dropdown.Section>
						<Dropdown.Item
							id="sign-out"
							onPress={onLogout}
							textValue="Log Out"
						>
							<Label className="flex items-center gap-3 font-bold text-sm cursor-pointer">
								<LogOut size={16} />
								Log out
							</Label>
						</Dropdown.Item>
					</Dropdown.Section>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
