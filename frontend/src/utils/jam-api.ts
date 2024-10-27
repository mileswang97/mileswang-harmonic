import axios from 'axios';

export interface ICompany {
    id: number;
    company_name: string;
    liked: boolean;
}

export interface ICollection {
    id: string;
    collection_name: string;
    companies: ICompany[];
    total: number;
}

export interface ICompanyBatchResponse {
    companies: ICompany[];
}

const BASE_URL = 'http://localhost:8000';

export async function getCompanies(offset?: number, limit?: number): Promise<ICompanyBatchResponse> {
    try {
        const response = await axios.get(`${BASE_URL}/companies`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsById(id: string, offset?: number, limit?: number): Promise<ICollection> {
    try {
        const response = await axios.get(`${BASE_URL}/collections/${id}`, {
            params: {
                offset,
                limit,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function getCollectionsMetadata(): Promise<ICollection[]> {
    try {
        const response = await axios.get(`${BASE_URL}/collections`);
        return response.data;
    } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
}

export async function addCompanyToList(companyId: number, collectionName: string = "Liked Companies List"): Promise<void> {
    try {
        const response = await axios.post(`${BASE_URL}/companies/${companyId}/add-to-collection`, {
            collection_name: collectionName
        });
        return response.data;
    } catch (error) {
        console.error('Error adding company to collection:', error);
        throw error;
    }
}

export async function removeCompanyFromList(companyId: number, collectionId: string): Promise<void> {
    try {
        const response = await axios.delete(`${BASE_URL}/companies/${companyId}/remove-from-collection/${collectionId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing company from collection:', error);
        throw error;
    }
}

export async function getAllCompanies(collectionId: string): Promise<ICompanyBatchResponse> {
    try {
        const response = await axios.get(`${BASE_URL}/collections/${collectionId}/companies/all`);
        return response.data;  // Return the CompanyBatchOutput
    } catch (error) {
        console.error('Error fetching all companies:', error);
        throw error;
    }
}