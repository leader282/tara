# Tara Store Data Deletion Requirements

> Internal release-readiness artifact. Complete the public URL and evidence fields before any App Store or Google Play submission.

## Current Status

- In-app account deletion request flow: present in account safety settings.
- Pending deletion cancellation flow: present for the requesting user.
- Server worker: present and dry-run by default until destructive deletion is verified in a controlled environment.
- Public data deletion URL: not yet hosted.
- Public store submission: not approved for Phase 14.

## Google Play Data Deletion Requirement

Before Google Play submission, Tara must provide a public data deletion URL that:

- Explains how users can request account and data deletion in the app.
- Offers an alternate support path for users who cannot access the app.
- Describes what data is deleted, what may be retained for legal/security reasons, and the expected timing.
- Matches the implemented account deletion behavior and Google Play Data Safety answers.

Required evidence before Play submission:

- Hosted URL:
- Support contact:
- Screenshot or recording of in-app deletion request flow:
- Confirmation that production deletion worker has been tested with `ACCOUNT_DELETION_DRY_RUN=false` in a controlled environment:

## Apple Account Deletion Requirement

Before App Store submission, Tara must verify that users can start account deletion from inside the app without contacting support first.

Required evidence before App Store submission:

- Screenshot or recording of account safety screen.
- Screenshot or recording of deletion confirmation using the required `DELETE` text.
- Screenshot or recording of pending deletion status and cancellation flow.
- Privacy policy URL that explains deletion timing and retention.
- Confirmation that user-facing copy matches implemented worker behavior.

## Public Release Gate

Do not submit Tara to public stores until the hosted public data deletion URL, privacy policy URL, App Store privacy labels, and Google Play Data Safety answers are complete and approved by the release owner.
