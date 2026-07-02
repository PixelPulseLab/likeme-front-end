import { render, waitFor } from '@testing-library/react-native';
import { GA4_EVENTS, logEvent, ANALYTICS_PARAMS } from '@/analytics';
import { SHARE_CONTENT_TYPES } from '@/constants/share';
import ShareContentUnavailable from './index';

jest.mock('@/analytics', () => ({
  GA4_EVENTS: { SELECT_CONTENT: 'select_content' },
  ANALYTICS_PARAMS: {
    ACTION_NAME: 'action_name',
    CONTENT_TYPE: 'content_type',
    ITEM_ID: 'item_id',
    SCREEN_NAME: 'screen_name',
  },
  logEvent: jest.fn(),
}));

jest.mock('@/hooks/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ShareContentUnavailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra analytics deep_link_content_unavailable ao montar', async () => {
    render(
      <ShareContentUnavailable
        contentType={SHARE_CONTENT_TYPES.COMMUNITY_POST}
        itemId='post-1'
        screenName='post_details'
      />,
    );

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
        [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_content_unavailable',
        [ANALYTICS_PARAMS.CONTENT_TYPE]: SHARE_CONTENT_TYPES.COMMUNITY_POST,
        [ANALYTICS_PARAMS.ITEM_ID]: 'post-1',
        [ANALYTICS_PARAMS.SCREEN_NAME]: 'post_details',
      });
    });
  });

  it('omite campos opcionais no analytics quando não informados', async () => {
    render(<ShareContentUnavailable />);

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(GA4_EVENTS.SELECT_CONTENT, {
        [ANALYTICS_PARAMS.ACTION_NAME]: 'deep_link_content_unavailable',
      });
    });
  });
});
