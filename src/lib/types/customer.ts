export type Customer = {
	customerNumber: number;
	customerName: string;
	contactLastName: string;
	contactFirstName: string;
	phone: string;
	addressLine1: string;
	addressLine2: string | null;
	city: string;
	state: string | null;
	postalCode: string;
	country: string;
	salesRepEmployeeNumber: number;
	creditLimit: string;
	orderCount?: number;
};

export type Order = {
	orderNumber: number;
	orderDate: string;
	requiredDate: string;
	shippedDate: string | null;
	status: string;
	comments: string | null;
	customerNumber: number;
};

export type Payment = {
	customerNumber: number;
	checkNumber: string;
	paymentDate: string;
	amount: string;
};
