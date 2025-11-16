
import { User, CalendarEvent, Meeting, Automation, AppSettings } from './types';

export const mockUser: User = {
  id: '1',
  email: 'webshookeng@gmail.com',
  name: 'John Advisor',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  connectedAccounts: {
    google: [
      { id: '1', email: 'webshookeng@gmail.com', name: 'John Advisor' },
      { id: '2', email: 'john.work@company.com', name: 'John Work Account' }
    ],
    linkedin: {
      id: 'li-1',
      name: 'John Advisor',
      connectedAt: '2025-01-10T10:00:00Z'
    }
  }
};

export const mockUpcomingEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Q4 Strategy Review with Sarah Chen',
    startTime: '2025-11-15T14:00:00Z',
    endTime: '2025-11-15T15:00:00Z',
    attendees: ['Sarah Chen', 'John Advisor'],
    platform: 'zoom',
    meetingLink: 'https://zoom.us/j/123456789',
    notetakerEnabled: true,
    accountEmail: 'webshookeng@gmail.com'
  },
  {
    id: '2',
    title: 'Investment Portfolio Discussion - Mike Johnson',
    startTime: '2025-11-16T10:00:00Z',
    endTime: '2025-11-16T11:00:00Z',
    attendees: ['Mike Johnson', 'John Advisor'],
    platform: 'teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/...',
    notetakerEnabled: false,
    accountEmail: 'john.work@company.com'
  },
  {
    id: '3',
    title: 'Retirement Planning Session - Lisa Martinez',
    startTime: '2025-11-17T15:30:00Z',
    endTime: '2025-11-17T16:30:00Z',
    attendees: ['Lisa Martinez', 'John Advisor'],
    platform: 'meet',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notetakerEnabled: true,
    accountEmail: 'webshookeng@gmail.com'
  }
];

export const mockPastMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Portfolio Review - David Thompson',
    startTime: '2025-11-10T14:00:00Z',
    endTime: '2025-11-10T15:00:00Z',
    attendees: ['David Thompson', 'John Advisor'],
    platform: 'zoom',
    transcript: [
      {
        speaker: 'John Advisor',
        timestamp: '00:00:15',
        text: 'Hi David, thanks for joining today. I wanted to review your portfolio performance and discuss some opportunities for Q4.'
      },
      {
        speaker: 'David Thompson',
        timestamp: '00:00:28',
        text: 'Thanks John. Yes, I\'ve been watching the market closely and wanted to get your thoughts on the recent volatility.'
      },
      {
        speaker: 'John Advisor',
        timestamp: '00:00:42',
        text: 'Absolutely. Your portfolio has shown resilience with a 7.2% return year-to-date. The diversification strategy we implemented has really helped mitigate risk.'
      },
      {
        speaker: 'David Thompson',
        timestamp: '00:01:05',
        text: 'That\'s great to hear. What about the tech sector allocation? Should we adjust anything there?'
      },
      {
        speaker: 'John Advisor',
        timestamp: '00:01:18',
        text: 'Good question. I recommend maintaining our current 25% tech allocation. The sector has strong fundamentals despite short-term fluctuations. We might consider rebalancing into some emerging AI companies in Q1 2026.'
      }
    ],
    socialPosts: [
      {
        id: 'sp1',
        platform: 'linkedin',
        content: '🎯 Just wrapped up an insightful portfolio review with a valued client!\n\nKey highlights:\n✅ 7.2% YTD returns despite market volatility\n✅ Diversification strategy proving its worth\n✅ Strategic tech sector positioning for long-term growth\n\nIn today\'s dynamic market, having a well-balanced portfolio isn\'t just smart—it\'s essential. Our focus on risk mitigation while capturing growth opportunities continues to deliver results.\n\n#WealthManagement #FinancialPlanning #InvestmentStrategy #PortfolioManagement',
        createdAt: '2025-11-10T15:05:00Z',
        posted: false
      },
      {
        id: 'sp2',
        platform: 'facebook',
        content: 'Great meeting today discussing investment strategies! 📈 Helping clients navigate market volatility while staying focused on long-term goals. If you\'re looking to optimize your portfolio, let\'s connect! #FinancialAdvisor #InvestmentPlanning',
        createdAt: '2025-11-10T15:05:00Z',
        posted: false
      }
    ],
    followUpEmail: `Subject: Portfolio Review Follow-Up - Next Steps

Hi David,

Thank you for taking the time to meet with me today. I wanted to recap our discussion and outline the next steps:

Key Takeaways:
• Your portfolio has delivered a strong 7.2% return YTD
• Current diversification strategy is effectively managing risk
• Tech sector allocation (25%) remains appropriate for your goals

Action Items:
1. Monitor Q4 performance and prepare for year-end tax planning
2. Schedule Q1 2026 meeting to discuss potential AI sector opportunities
3. Review beneficiary designations on retirement accounts

Please don't hesitate to reach out if you have any questions or concerns before our next scheduled meeting.

Best regards,
John Advisor`
  },
  {
    id: 'm2',
    title: 'Estate Planning Discussion - Margaret Wilson',
    startTime: '2025-11-08T10:00:00Z',
    endTime: '2025-11-08T11:00:00Z',
    attendees: ['Margaret Wilson', 'John Advisor'],
    platform: 'teams',
    transcript: [
      {
        speaker: 'John Advisor',
        timestamp: '00:00:10',
        text: 'Good morning Margaret. Today we\'ll focus on your estate planning needs and ensuring your legacy is protected.'
      },
      {
        speaker: 'Margaret Wilson',
        timestamp: '00:00:22',
        text: 'Morning John. Yes, I want to make sure everything is in order for my family.'
      },
      {
        speaker: 'John Advisor',
        timestamp: '00:00:35',
        text: 'I\'ve reviewed your current estate structure. We should consider updating your trust documents and reviewing beneficiary designations across all accounts.'
      }
    ],
    socialPosts: [
      {
        id: 'sp3',
        platform: 'linkedin',
        content: '🏡 Estate planning isn\'t just for the wealthy—it\'s for anyone who cares about their family\'s future.\n\nToday\'s client meeting reminded me why this work matters:\n• Protecting loved ones from unnecessary complications\n• Ensuring your wishes are clearly documented\n• Minimizing tax burden on your estate\n• Creating peace of mind for you and your family\n\nDon\'t wait to have these important conversations. Your future self (and your family) will thank you.\n\n#EstatePlanning #WealthManagement #FinancialPlanning #LegacyPlanning',
        createdAt: '2025-11-08T11:05:00Z',
        posted: true,
        postedAt: '2025-11-08T11:10:00Z'
      }
    ],
    followUpEmail: `Subject: Estate Planning Meeting - Action Items

Dear Margaret,

Thank you for our productive discussion this morning regarding your estate planning needs.

Summary:
• Reviewed current trust structure
• Identified need for beneficiary designation updates
• Discussed long-term care planning options

Next Steps:
1. I'll coordinate with your attorney to update trust documents
2. Please review the beneficiary update forms I'll send by end of week
3. Schedule follow-up in 30 days to finalize changes

Looking forward to helping you secure your family's future.

Warm regards,
John Advisor`
  }
];

export const defaultSettings: AppSettings = {
  id: 'settings-1',
  userId: '1',
  botJoinMinutes: 2,
  automations: [
    {
      id: 'a1',
      name: 'LinkedIn Professional Update',
      type: 'generate_post',
      platform: 'linkedin',
      description:
        'Create a professional LinkedIn recap highlighting key insights, value delivered, and next steps from the meeting. Keep it concise and actionable.',
      example:
        'Wrapped a fantastic strategy session with Sarah Chen—excited about the growth roadmap we outlined for Q1!'
    },
    {
      id: 'a2',
      name: 'Facebook Community Post',
      type: 'generate_post',
      platform: 'facebook',
      description:
        'Friendly, approachable Facebook summary that invites conversation and spotlights how you helped the client move forward.',
      example:
        'Nothing better than helping a family feel confident about their college savings plan. Grateful for clients who trust the process!'
    }
  ],
  createdAt: '2025-11-01T00:00:00Z',
  updatedAt: '2025-11-01T00:00:00Z'
};
