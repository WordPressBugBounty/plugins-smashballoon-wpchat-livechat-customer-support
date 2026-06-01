import { wpChatAPI } from '@Utils/apiHelper';
import { logFaqClick, logFaqSearch, logFaqSearchAppearances } from '@FDataStore/Chat/analyticsApi';

const getNonce = () => window.wpChatFrontend?.frontendNonce || window.wpChatAdmin?.restNonce || '';
const getContext = () => window.wpChatFrontend ? 'frontend' : 'admin';

export const fetchInitialFaqs = async (limit = 5, offset = 0) => {
    return await wpChatAPI.get('faqs', {
        per_page: limit,
        offset: offset,
        popular: 'true',
        nonce: getNonce()
    }, getContext());
};

export const searchFaqs = async (query) => {
    const params = new URLSearchParams({
        query: query,
        nonce: getNonce(),
    });
    
    const results = await wpChatAPI.get('faqs/search', {
        query: query,
        nonce: getNonce()
    }, getContext());
    
    // Log search analytics
    if (results) {
        const resultsCount = Array.isArray(results) ? results.length : 0;
        
        // Log the main search event
        logFaqSearch(query, resultsCount);
        
        // Log FAQ search appearances using batch method
        if (Array.isArray(results) && results.length > 0) {
            logFaqSearchAppearances(results, query);
        }
    }
    
    return results;
};

export const trackFaqClick = async (faqId, faqQuestion) => {
    // Log click analytics
    logFaqClick(faqId, faqQuestion, 'list');
    
    return await wpChatAPI.post('faqs/click', {
        faq_id: faqId,
        nonce: getNonce()
    }, getContext());
}; 
