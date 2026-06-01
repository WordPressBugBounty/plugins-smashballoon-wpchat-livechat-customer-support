import { wpChatAPI } from '@Utils/apiHelper';

export const FAQS_PER_PAGE = 5;

export const fetchFaqs = async (page = 1) => {
    return await wpChatAPI.get('faqs', { page, per_page: FAQS_PER_PAGE });
};

export const createFaq = async (faqData) => {
    const response = await wpChatAPI.post('faqs', faqData);
    if (response && response.status === 201) {
        return response.id; // Return the created FAQ ID
    }
    return false;
};

export const updateFaq = async (id, faqData) => {
    const response = await wpChatAPI.put(`faqs/${id}`, faqData);
    return response && response.status === 200;
};

export const deleteFaq = async (id) => {
    const response = await wpChatAPI.delete(`faqs/${id}`);
    return response && response.status === 200;
};

export const fetchFaq = async (id) => {
    return await wpChatAPI.get(`faqs/${id}`);
};

export const cloneFaq = async (id) => {
    const response = await wpChatAPI.post(`faqs/${id}/clone`);
    return response && response.status === 201;
};

export const bulkDeleteFaqs = async (ids) => {
    const response = await wpChatAPI.post('faqs/bulk-delete', { ids });
    return response && response.status === 200;
}; 