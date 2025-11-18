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
};
