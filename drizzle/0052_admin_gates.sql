-- Gate 0-1: Admin preview gate + launch release gate
-- Adds adminPreviewApprovedAt, adminLaunchApprovedAt, and pending_admin_review stage

-- Extend stage enum to include pending_admin_review
ALTER TABLE `onboarding_projects`
  MODIFY COLUMN `stage`
    ENUM('intake','questionnaire','assets_upload','design','pending_admin_review','review','revisions','final_approval','launch','complete')
    NOT NULL DEFAULT 'intake';

-- Admin preview gate: set when admin approves the generated site for customer preview
ALTER TABLE `onboarding_projects`
  ADD COLUMN `adminPreviewApprovedAt` TIMESTAMP NULL DEFAULT NULL AFTER `previewReadyAt`;

-- Admin launch gate: set when admin releases the customer-approved site for deployment
ALTER TABLE `onboarding_projects`
  ADD COLUMN `adminLaunchApprovedAt` TIMESTAMP NULL DEFAULT NULL AFTER `adminPreviewApprovedAt`;
