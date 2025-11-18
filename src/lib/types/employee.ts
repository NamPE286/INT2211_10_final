export type Office = {
	officeCode: string;
	city: string;
	phone: string;
	addressLine1: string;
	addressLine2: string | null;
	state: string | null;
	country: string;
	postalCode: string;
	territory: string;
};

export type Employee = {
	employeeNumber: number;
	lastName: string;
	firstName: string;
	extension: string;
	email: string;
	officeCode: string;
	reportsTo: number | null;
	jobTitle: string;
	// Joined from offices table
	city?: string;
	phone?: string;
	addressLine1?: string;
	addressLine2?: string | null;
	state?: string | null;
	country?: string;
	postalCode?: string;
	territory?: string;
	// Manager information
	managerName?: string;
};
