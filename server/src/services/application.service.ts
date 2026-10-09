import mongoose from 'mongoose';
import { Application } from '../models/application.model';
import { Challenge } from '../models/challenge.model';
import { isChallengeAcceptingApplications } from './challenge.service';

export const createApplication = async (
    challengeId: string,
    applicantId: string,
    motivation: string,
    skills: string[]
) => {
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    const accepting =
        await isChallengeAcceptingApplications(challengeId);

    if (!accepting) {
        throw new Error(
            'CHALLENGE_NOT_ACCEPTING_APPLICATIONS'
        );
    }

    const existingApplication =
        await Application.findOne({
            challenge: challenge._id,
            applicant: new mongoose.Types.ObjectId(
                applicantId
            ),
        });

    if (existingApplication) {
        throw new Error(
            'APPLICATION_ALREADY_EXISTS'
        );
    }

    const application = await Application.create({
        challenge: challenge._id,
        applicant: new mongoose.Types.ObjectId(
            applicantId
        ),
        motivation,
        skills,
        status: 'PENDING',
    });

    return application;
};



export const getMyApplications = async (
    applicantId: string
) => {
    const applications = await Application.find({
        applicant: new mongoose.Types.ObjectId(
            applicantId
        ),
    })
        .populate(
            'challenge',
            'title description status deadline skills eligibility'
        )
        .sort({ createdAt: -1 });

    return applications;
};



export const getApplicationsForChallenge = async (
    challengeId: string
) => {
    const challenge =
        await Challenge.findById(challengeId);

    if (!challenge) {
        throw new Error('CHALLENGE_NOT_FOUND');
    }

    const applications =
        await Application.find({
            challenge: challenge._id,
        })
            .populate(
                'applicant',
                'name email role'
            )
            .sort({ createdAt: -1 });

    return applications;
};




export const reviewApplication = async (
    applicationId: string,
    adminId: string,
    status: 'ACCEPTED' | 'REJECTED',
    reviewNote?: string
) => {
    const application =
        await Application.findById(applicationId);

    if (!application) {
        throw new Error(
            'APPLICATION_NOT_FOUND'
        );
    }

    if (application.status !== 'PENDING') {
        throw new Error(
            'APPLICATION_ALREADY_REVIEWED'
        );
    }

    if (
        status === 'REJECTED' &&
        !reviewNote
    ) {
        throw new Error(
            'REVIEW_NOTE_REQUIRED'
        );
    }

    application.status = status;

    application.reviewedBy =
        new mongoose.Types.ObjectId(
            adminId
        );

    application.reviewNote =
        reviewNote;

    await application.save();

    return application;
};