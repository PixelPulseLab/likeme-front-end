import { SPACING } from '@/constants';
import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
    opacity: 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#001137',
    fontFamily: 'DM Sans',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
    marginTop: -50,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageStyle: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 327,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroContent: {
    zIndex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(0, 17, 55, 0.64)',
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 16,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: '#f6dea9',
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  paginationDot: {
    width: 10,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#b2b2b2',
  },
  paginationDotActive: {
    backgroundColor: '#0154f8',
  },
  contentSection: {
    paddingHorizontal: 32,
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: SPACING.MD,
    marginBottom: 16,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  tabsShareButton: {
    flexShrink: 0,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#fdfbee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tabActive: {
    backgroundColor: '#0154f8',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: '#001137',
  },
  tabTextActive: {
    color: '#fbf7e5',
  },
  tabContent: {
    paddingHorizontal: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  descriptionContainer: {
    gap: 8,
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6e6a6a',
    marginTop: 8.5,
    flexShrink: 0,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: '#6e6a6a',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  otherOptionsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: '#000000',
  },
  optionsList: {
    flexDirection: 'row',
    gap: 4,
    paddingLeft: 16,
  },
  optionItem: {
    alignItems: 'center',
    width: 74,
    gap: 8,
  },
  optionImage: {
    width: 69,
    height: 64,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 8,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: '#6e6a6a',
    letterSpacing: 0.2,
    lineHeight: 22,
    textAlign: 'center',
    width: 86,
  },
  partnerSection: {
    marginTop: SPACING.LG,
    gap: SPACING.MD,
  },
  buySection: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
    paddingTop: SPACING.MD,
  },
  buyButton: {
    alignSelf: 'center',
    width: '100%',
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '400',
    color: '#6e6a6a',
    lineHeight: 18.2,
    textAlign: 'center',
    width: 326,
  },
  learnMoreLink: {
    textDecorationLine: 'underline',
  },
});
