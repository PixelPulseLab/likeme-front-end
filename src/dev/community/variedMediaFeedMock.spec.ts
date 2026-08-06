import { COMMUNITY_MEDIA_TEST_ID } from '@/constants/community/communityMediaTest';
import { mapCommunityPostsForFeedList } from '@/utils/community/mappers';
import { variedMediaTestFeedApiResponse, variedMediaTestFeedData } from '@/dev/community/variedMediaFeedMock';

describe('variedMediaFeedMock', () => {
  it('mapeia posts mock com imagem, vídeo e PDF', () => {
    const feedData = variedMediaTestFeedData();
    const posts = mapCommunityPostsForFeedList(feedData.posts ?? [], feedData);

    expect(posts.length).toBeGreaterThanOrEqual(6);

    const singleImage = posts.find((post) => post.id === 'mock-post-single-image');
    expect(singleImage?.attachments?.some((item) => item.type === 'image')).toBe(true);

    const multiImage = posts.find((post) => post.id === 'mock-post-multi-image');
    expect(multiImage?.attachments?.filter((item) => item.type === 'image').length).toBeGreaterThanOrEqual(2);

    const videoOnly = posts.find((post) => post.id === 'mock-post-video');
    expect(videoOnly?.videoUrl).toBeTruthy();

    const mixed = posts.find((post) => post.id === 'mock-post-images-and-video');
    expect(mixed?.attachments?.filter((item) => item.type === 'image').length).toBeGreaterThanOrEqual(2);
    expect(mixed?.videoUrl).toBeTruthy();

    const pdfPost = posts.find((post) => post.id === 'mock-post-pdf');
    expect(pdfPost?.attachments?.some((item) => item.type === 'pdf')).toBe(true);
  });

  it('responde API paginada na primeira página', () => {
    const response = variedMediaTestFeedApiResponse({
      communityId: COMMUNITY_MEDIA_TEST_ID,
      page: 1,
      limit: 10,
    });

    expect(response.success).toBe(true);
    expect(response.data?.data?.posts?.length).toBe(6);
  });
});
