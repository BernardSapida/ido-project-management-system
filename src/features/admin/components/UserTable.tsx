import { Chip, Table } from "@heroui/react";
import moment from "moment";
import { USER_ROLES } from "@/utils/config";
import { ADMIN_STATUS_MAPPINGS, type UserStatus } from "../config/admin.config";

interface User {
	id: string;
	name: string;
	firstname: string;
	lastname: string;
	email: string;
	role: string;
	status: string;
	createdAt: Date | string;
}

interface UserTableProps {
	users: User[];
}

export function UserTable({ users }: UserTableProps) {
	return (
		<Table variant="secondary">
			<Table.ScrollContainer>
				<Table.Content aria-label="Recent user signups">
					<Table.Header>
						<Table.Column isRowHeader>User Identity</Table.Column>
						<Table.Column>Primary Role</Table.Column>
						<Table.Column>Account Status</Table.Column>
						<Table.Column>Latest Activity</Table.Column>
					</Table.Header>
					<Table.Body>
						{users.map((u) => {
							const statusCfg = ADMIN_STATUS_MAPPINGS[u.status as UserStatus] || ADMIN_STATUS_MAPPINGS.pending;

							return (
								<Table.Row
									className="hover:bg-black/5 transition-colors cursor-pointer border-b border-text-primary/5"
									key={u.id}
								>
									<Table.Cell>
										<div className="flex flex-col text-left">
											<span className="text-text-primary text-base font-bold">
												{u.name || `${u.firstname} ${u.lastname}`}
											</span>
											<span className="text-text-secondary text-xs">{u.email}</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Chip
											className="font-bold px-3 uppercase tracking-tighter"
											color={u.role === USER_ROLES.ADMIN ? "danger" : "accent"}
											size="sm"
											variant="soft"
										>
											{u.role}
										</Chip>
									</Table.Cell>
									<Table.Cell>
										<div className="flex items-center gap-2">
											<div className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
											<span className="text-text-primary/80 font-bold capitalize text-xs tracking-tight">
												{statusCfg.label}
											</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<span className="text-text-secondary/60 font-medium text-[10px] uppercase tracking-wider">
											{moment(u.createdAt).fromNow()}
										</span>
									</Table.Cell>
								</Table.Row>
							);
						})}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
}
