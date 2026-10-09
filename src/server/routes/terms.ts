import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TermsAcceptance } from '../models/TermsAcceptance.js';
import { User } from '../models/User.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

export const CURRENT_TERMS_VERSION = '1.0';
export const TERMS_LAST_UPDATED = '2026-10-09';

export const TERMS_DOCUMENT_METADATA = {
  title: 'Mark Driller CBT Platform — Student Terms & Conditions',
  version: CURRENT_TERMS_VERSION,
  lastUpdated: TERMS_LAST_UPDATED,
  contact: {
    platform: 'Mark Driller CBT Platform',
    email: 'markzionsinachi@gmail.com',
    phone: '08160133154',
    website: 'markdriller.ng',
  },
  introduction:
    'Welcome to Mark Driller CBT Platform. These Terms & Conditions establish the rules that every student must agree to follow before using our Computer-Based Test (CBT) platform. By creating an account, logging in, starting a test, or using any service on this platform, you confirm that you have read, understood, and agreed to these Terms & Conditions.',
  sections: [
    {
      number: 1,
      title: 'Student Account',
      items: [
        'Each student is responsible for providing accurate information when creating an account.',
        'Students must keep their login details confidential and must not share their account with another person.',
        'Students are responsible for activities carried out through their account.',
        'Mark Driller may suspend or restrict an account where there is evidence of misuse, cheating, impersonation, or violation of these Terms.',
      ],
    },
    {
      number: 2,
      title: 'Examination Rules',
      items: [
        'Students must read all instructions carefully before starting a test.',
        'Students must complete the examination independently unless the test specifically allows collaboration.',
        'Students must submit answers before the examination time expires.',
        'Students must follow all instructions displayed on the examination page.',
        'Students must remain on the examination page where required by the particular test.',
        'Students must NOT receive unauthorized assistance from another person.',
        'Students must NOT allow another person to take a test on their behalf.',
        'Students must NOT copy, distribute, photograph, record, or reproduce examination questions without permission.',
        'Students must NOT attempt to manipulate the CBT system or examination results.',
        'Students must NOT use unauthorized materials or resources where the test rules prohibit them.',
        'Students must NOT attempt to gain unauthorized access to another student’s account or examination.',
      ],
    },
    {
      number: 3,
      title: 'Timing',
      items: [
        'Each CBT may have a specified duration.',
        'The countdown timer begins according to the test settings.',
        'Students are responsible for managing their examination time.',
        'Where the system automatically submits a test when time expires, answers saved by the system at that time may be submitted automatically.',
        'Students should not wait until the final seconds to submit their examination.',
      ],
    },
    {
      number: 4,
      title: 'Technical Problems',
      items: [
        'Mark Driller will make reasonable efforts to keep the platform available and functioning properly. However, technical problems may occasionally occur because of internet connectivity, device problems, browser problems, power interruptions, server maintenance, or other circumstances beyond our control.',
        'Students should use a reliable internet connection where possible.',
        'Students should ensure their device has sufficient battery power.',
        'Students should use a supported and updated browser.',
        'Students should report serious technical problems as soon as they occur.',
        'A technical problem does not automatically guarantee that an examination will be reset or a result changed. Any decision regarding a reset or retake will depend on the circumstances and applicable examination rules.',
      ],
    },
    {
      number: 5,
      title: 'Results and Scores',
      items: [
        'Results displayed by the platform are based on the answers recorded by the CBT system.',
        'Students should carefully review their submitted answers where the test settings allow this.',
        'Mark Driller reserves the right to correct a result where a genuine technical or administrative error is identified.',
        'Where a test is being used by a school, organization, or examination body, the rules of that organization may also apply.',
      ],
    },
    {
      number: 6,
      title: 'Cheating and Misconduct',
      items: [
        'Any attempt to cheat, impersonate another student, manipulate the examination system, or obtain unauthorized assistance may result in:',
        '• Cancellation of the affected test.',
        '• Removal or withholding of the result.',
        '• Suspension or termination of the student’s account.',
        '• Disqualification from a particular CBT.',
        '• Further action where required by the relevant school or organization.',
      ],
    },
    {
      number: 7,
      title: 'Content and Intellectual Property',
      items: [
        'All examination questions, practice materials, graphics, logos, software, text, and other materials provided on the Mark Driller platform belong to Mark Driller or their respective rights holders unless otherwise stated.',
        'Students may use the materials for their permitted educational purposes but must not reproduce, sell, redistribute, publish, or commercially exploit them without authorization.',
      ],
    },
    {
      number: 8,
      title: 'Prohibited Activities',
      items: [
        'Students must NOT hack, attack, damage, or interfere with the platform.',
        'Students must NOT attempt to bypass security measures.',
        'Students must NOT introduce malicious software or harmful code.',
        'Students must NOT access information belonging to another student.',
        'Students must NOT reverse engineer or unlawfully copy the platform.',
        'Students must NOT use automated methods to interfere with examinations.',
        'Students must NOT upload unlawful, harmful, offensive, or unauthorized content.',
      ],
    },
    {
      number: 9,
      title: 'Privacy and Student Information',
      items: [
        'Students should provide only accurate information requested by the platform.',
        'Information collected through the platform may be used for purposes such as creating and managing student accounts, delivering CBT examinations, recording examination attempts and scores, providing results and educational services, and maintaining platform security and preventing abuse.',
        'Personal information will be handled in accordance with the platform’s applicable privacy policy and relevant laws.',
      ],
    },
    {
      number: 10,
      title: 'Payments and Refunds',
      items: [
        'Where paid CBT services are offered, students should confirm the selected service before making payment.',
        'Payment does not guarantee a particular examination result.',
        'Refunds, where applicable, will be handled according to the platform’s refund policy.',
        'Students must not attempt fraudulent payment transactions or chargebacks.',
      ],
    },
    {
      number: 11,
      title: 'Platform Availability',
      items: [
        'Mark Driller may occasionally need to suspend or limit access to the platform for maintenance, updates, security reasons, or circumstances beyond its reasonable control.',
        'Where reasonably possible, students may be notified of planned maintenance or significant service interruptions.',
      ],
    },
    {
      number: 12,
      title: 'Changes to These Terms',
      items: [
        'Mark Driller may update these Terms & Conditions when necessary to reflect changes to the platform, services, security requirements, or applicable laws.',
        'Updated terms may be published on the website, and continued use of the platform after an update may constitute acceptance of the revised terms.',
      ],
    },
    {
      number: 13,
      title: 'Student Declaration',
      items: [
        'Before starting a CBT, the student confirms that:',
        '☑ I have read and understood the Mark Driller CBT Terms & Conditions.',
        '☑ I agree to follow all examination instructions and rules.',
        '☑ I understand that cheating, impersonation, unauthorized assistance, and attempts to manipulate the CBT system are prohibited.',
        '☑ I understand that violation of these rules may result in cancellation of my test, withholding of my result, suspension of my account, or other appropriate action.',
        '☑ I confirm that the information provided by me is accurate.',
        '☑ I agree to use the Mark Driller CBT platform responsibly and lawfully.',
      ],
    },
    {
      number: 14,
      title: 'Acceptance',
      items: [
        'By selecting “I Agree”, “Accept Terms & Conditions”, or starting a CBT examination, the student confirms that they have read, understood, and agreed to comply with these Terms & Conditions.',
      ],
    },
  ],
};

const acceptTermsSchema = z.object({
  version: z.string().default(CURRENT_TERMS_VERSION),
  declarationChecklist: z.object({
    readAndUnderstood: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm that you have read and understood the Terms & Conditions.' }),
    }),
    followInstructions: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to follow examination instructions and rules.' }),
    }),
    antiCheating: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm understanding that cheating and impersonation are prohibited.' }),
    }),
    understandConsequences: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm understanding of the consequences of misconduct.' }),
    }),
    accurateInformation: z.literal(true, {
      errorMap: () => ({ message: 'You must confirm that your information is accurate.' }),
    }),
    lawfulUse: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to use the platform responsibly and lawfully.' }),
    }),
  }),
});

const router = Router();

// GET /api/terms/active — Public terms document and metadata
router.get('/active', (_req, res: Response) => {
  res.status(200).json({
    success: true,
    data: TERMS_DOCUMENT_METADATA,
  });
});

// GET /api/terms/status — Authenticated student terms acceptance status
router.get(
  '/status',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const user = await User.findById(userId, 'acceptedTermsVersion acceptedTermsAt role');

      const isCurrentVersionAccepted = user?.acceptedTermsVersion === CURRENT_TERMS_VERSION;
      let acceptedAt = user?.acceptedTermsAt;

      // Double-check immutable TermsAcceptance audit log if not on user record
      if (!isCurrentVersionAccepted) {
        const auditRecord = await TermsAcceptance.findOne({
          userId,
          termsVersion: CURRENT_TERMS_VERSION,
        });
        if (auditRecord) {
          acceptedAt = auditRecord.acceptedAt;
          // Sync to user record for O(1) checks
          await User.updateOne(
            { _id: userId },
            { $set: { acceptedTermsVersion: CURRENT_TERMS_VERSION, acceptedTermsAt: auditRecord.acceptedAt } }
          );
        }
      }

      res.status(200).json({
        success: true,
        data: {
          termsVersion: CURRENT_TERMS_VERSION,
          hasAccepted: isCurrentVersionAccepted || Boolean(acceptedAt),
          acceptedAt: acceptedAt || null,
          title: TERMS_DOCUMENT_METADATA.title,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/terms/accept — Authenticated explicit student acceptance
router.post(
  '/accept',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!._id;
      const parsed = acceptTermsSchema.parse(req.body);

      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent']?.slice(0, 255) || 'Unknown';

      // Record in immutable TermsAcceptance audit log idempotently
      const acceptanceRecord = await TermsAcceptance.findOneAndUpdate(
        { userId, termsVersion: CURRENT_TERMS_VERSION },
        {
          $setOnInsert: {
            userId,
            termsVersion: CURRENT_TERMS_VERSION,
            acceptedAt: new Date(),
            ipAddress,
            userAgent,
            declarationDetails: parsed.declarationChecklist,
          },
        },
        { upsert: true, new: true }
      );

      // Update student user record
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            acceptedTermsVersion: CURRENT_TERMS_VERSION,
            acceptedTermsAt: acceptanceRecord.acceptedAt,
          },
        }
      );

      res.status(200).json({
        success: true,
        message: 'Student Terms & Conditions accepted successfully.',
        data: {
          termsVersion: CURRENT_TERMS_VERSION,
          acceptedAt: acceptanceRecord.acceptedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'All declaration items must be accepted before proceeding.',
            details: error.flatten().fieldErrors,
          },
        });
        return;
      }
      next(error);
    }
  }
);

// GET /api/terms/audit — Administrator overview of student acceptance records
router.get(
  '/audit',
  authenticateToken,
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [totalAcceptances, currentVersionAcceptances, recentAcceptances] = await Promise.all([
        TermsAcceptance.countDocuments(),
        TermsAcceptance.countDocuments({ termsVersion: CURRENT_TERMS_VERSION }),
        TermsAcceptance.find()
          .sort({ acceptedAt: -1 })
          .limit(20)
          .populate('userId', 'fullName email role')
          .lean(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          activeVersion: CURRENT_TERMS_VERSION,
          totalAcceptances,
          currentVersionAcceptances,
          recentAcceptances,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
