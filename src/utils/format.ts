import moment from "moment";

export const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(value);
};

export const formatDate = (date: string | Date, format = "MMM DD, YYYY") => {
	return moment(date).format(format);
};

export const formatRelativeTime = (date: string | Date) => {
	return moment(date).fromNow();
};

export const truncateText = (text: string, length: number) => {
	if (text.length <= length) {
		return text;
	}
	return `${text.slice(0, length)}...`;
};
