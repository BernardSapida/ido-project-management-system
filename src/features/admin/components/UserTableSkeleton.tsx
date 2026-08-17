import { Skeleton, Table } from "@heroui/react";

export function UserTableSkeleton() {
	return (
		<Table variant="secondary">
			<Table.ScrollContainer>
				<Table.Content aria-label="Loading users">
					<Table.Header>
						<Table.Column isRowHeader>User Identity</Table.Column>
						<Table.Column>Primary Role</Table.Column>
						<Table.Column>Account Status</Table.Column>
						<Table.Column>Latest Activity</Table.Column>
					</Table.Header>
					<Table.Body>
						{Array.from({ length: 5 }).map((_, index) => (
							<Table.Row
								className="border-b border-text-primary/5"
								key={index}
							>
								<Table.Cell>
									<div className="flex flex-col gap-2">
										<Skeleton className="h-4 w-32 rounded-lg" />
										<Skeleton className="h-3 w-48 rounded-lg" />
									</div>
								</Table.Cell>
								<Table.Cell>
									<Skeleton className="h-6 w-16 rounded-full" />
								</Table.Cell>
								<Table.Cell>
									<div className="flex items-center gap-2">
										<Skeleton className="h-2 w-2 rounded-full" />
										<Skeleton className="h-3 w-12 rounded-lg" />
									</div>
								</Table.Cell>
								<Table.Cell>
									<Skeleton className="h-3 w-20 rounded-lg" />
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table.Content>
			</Table.ScrollContainer>
		</Table>
	);
}
