import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import useAnalyticsStore from '@DataStore/analytics/analyticsStore';
import TimeRangeSelect from './TimeRangeSelect';
import StateView from './StateView';
import PeriodInfo from './PeriodInfo';
import UpgradeToProBlurNotice from '@AC/UpgradeToProBlurNotice';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { useEntitlements } from '@AH/useEntitlements';

// Dummy data for users without advanced analytics entitlement
const DUMMY_FAQS = [
  { faq_id: 1, faq_question_text: __('How do I reset my password?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 245 },
  { faq_id: 2, faq_question_text: __('What are your business hours?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 189 },
  { faq_id: 3, faq_question_text: __('How can I track my order?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 156 },
  { faq_id: 4, faq_question_text: __('What is your refund policy?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 134 },
  { faq_id: 5, faq_question_text: __('How do I contact support?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 98 },
  { faq_id: 6, faq_question_text: __('Do you offer international shipping?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 87 },
  { faq_id: 7, faq_question_text: __('How do I cancel my subscription?', 'smashballoon-wpchat-livechat-customer-support'), total_clicks_period: 76 },
];

const FrequentQuestions = () => {
  const [timeRange, setTimeRange] = useState('this_month');
  const { isPro: isProPlan, hasFeature } = useEntitlements();
  const upgradeDialogData = getUpgradeDialogData('analytics', {
    isPro: isProPlan,
    isFeatureAccess: true,
    ...upgradeConfigs.analytics,
  });

  const {
    loadFaqAnalytics,
    faqAnalytics,
    faqAnalyticsLoading,
    faqAnalyticsError,
  } = useAnalyticsStore();

  // Check if user has advanced analytics entitlement
  const hasAdvancedAnalytics = hasFeature('wpchat.analytics.advanced');

  useEffect(() => {
    loadFaqAnalytics({ time_range: timeRange });
  }, [timeRange]);

  // Use the correct structure from the API response - use dummy data if user doesn't have entitlement
  const topFaqs = hasAdvancedAnalytics ? (faqAnalytics?.data?.top_faqs || []) : DUMMY_FAQS;
  const selectedTimeRange = faqAnalytics?.time_range || timeRange;
  const timezoneInfo = faqAnalytics?.data?.timezone_info || {};
  const period = faqAnalytics?.data?.period || {};

  return (
    <section className="wpchat:mb-8">
      <div className="wpchat:grid wpchat:grid-cols-1 wpchat:md:grid-cols-2 wpchat:gap-3 wpchat:items-center wpchat:mb-3.5">
        <h3 className="wpchat:text-2xl wpchat:font-semibold wpchat:text-gray-900 wpchat:m-0">{__('Frequent Questions', 'smashballoon-wpchat-livechat-customer-support')}</h3>
        <TimeRangeSelect
          value={selectedTimeRange}
          onChange={setTimeRange}
          className="wpchat:min-w-[150px] wpchat:md:ms-auto wpchat:md:me-0"
        />
      </div>
      <div className="wpchat:bg-white wpchat:rounded-lg wpchat:shadow">
        <div className="wpchat:flex wpchat:items-center wpchat:justify-between wpchat:border-b wpchat:border-gray-200 wpchat:py-3 wpchat:px-5">
          <h3 className="wpchat:font-semibold wpchat:text-sm wpchat:text-gray-900 wpchat:m-0 ">{__('Popular Questions', 'smashballoon-wpchat-livechat-customer-support')}</h3>
        </div>
        <UpgradeToProBlurNotice
          icon="rateReview"
          title={__('Know which FAQs are most popular when you upgrade', 'smashballoon-wpchat-livechat-customer-support')}
          upgradeDialogData={upgradeDialogData}
          requiredEntitlement="wpchat.analytics.advanced"
          >

          {hasAdvancedAnalytics && faqAnalyticsLoading ? (
            <StateView state="loading" />
          ) : hasAdvancedAnalytics && faqAnalyticsError ? (
            <StateView
              state="error"
              heading={__('Error', 'smashballoon-wpchat-livechat-customer-support')}
              message={faqAnalyticsError}
            />
          ) : hasAdvancedAnalytics && topFaqs.length === 0 ? (
            <StateView
              state="empty"
              heading={__('Not enough interactions', 'smashballoon-wpchat-livechat-customer-support')}
              message={__('Come back after a few real conversations — we\'ll show what people found helpful (or not).', 'smashballoon-wpchat-livechat-customer-support')}
              icon="pointerClick"
            />
          ) : (
            <>
              <table className="wpchat:w-full wpchat:text-start">
                <thead>
                  <tr className="wpchat:border-b wpchat:border-gray-200 wpchat:bg-gray-50">
                    <th className="wpchat:py-2 wpchat:text-xs wpchat:text-gray-800 wpchat:px-6">{__('Name', 'smashballoon-wpchat-livechat-customer-support')}</th>
                    <th className="wpchat:py-2 wpchat:text-xs wpchat:text-gray-800 wpchat:px-4 wpchat:text-end">{__('Clicks', 'smashballoon-wpchat-livechat-customer-support')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topFaqs.map((faq, idx) => (
                    <tr
                      key={faq.faq_id || idx}
                      className={idx === topFaqs.length - 1 ? '' : 'wpchat:border-b wpchat:border-b-gray-200'}
                    >
                      <td className="wpchat:py-3 wpchat:px-6">{faq.faq_question_text}</td>
                      <td className="wpchat:py-3 wpchat:px-6 wpchat:text-end">
                        {faq.total_clicks_period || faq.total_clicks || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="wpchat:px-4 wpchat:py-2">
                <PeriodInfo period={period} timezoneInfo={timezoneInfo} />
              </div>
            </>
          )}
        </UpgradeToProBlurNotice>
      </div>
    </section>
  );
};

export default FrequentQuestions; 