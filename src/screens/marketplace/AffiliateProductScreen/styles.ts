import { SPACING } from '@/constants';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DM Sans',
    fontWeight: '500',
    color: '#001137',
  },
  tabContent: {
    paddingHorizontal: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
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
  partnerSection: {
    marginTop: SPACING.LG,
    gap: SPACING.MD,
  },
  recommendedSection: {
    marginTop: SPACING.MD,
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
