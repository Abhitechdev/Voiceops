# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# VoiceOps — Voice-Based Issue Reporting and Management System

**Version:** 1.0  
**Project Type:** AI-powered operational workflow application  
**Target:** Gnani AI Great Indian AI Internship Challenge 2026  
**Development Approach:** Phase-by-phase, test-driven implementation  
**Primary Interface:** Responsive web application  
**Primary AI Capability:** Gnani AI speech recognition  
**Target MVP Deadline:** November 10, 2026  
**Project Status:** Planned

---

# 1. Executive Summary

## 1.1 Product Overview

VoiceOps is a voice-first issue reporting and management platform that converts spoken complaints into structured, trackable service tickets.

Users can record a complaint in a supported Indian language, review the speech transcript, confirm the extracted information, and submit an issue. Administrators can view reported issues, assign priorities, update ticket statuses, and analyze recurring problems using a centralized dashboard.

The application will use Gnani AI speech technology for transcription, subject to successful API access and validation. A separate information-extraction component will convert the transcript into structured issue fields.

VoiceOps is not a general-purpose chatbot. It is an operational workflow system designed to move a real-world issue from reporting to resolution.

## 1.2 Problem Statement

Organizations such as colleges, apartment complexes, and small businesses receive complaints through informal channels, including verbal communication, phone calls, messaging applications, and direct conversations.

These processes create several challenges:

- Complaints may be lost or forgotten.
- Users may not know how to submit a formal report.
- Regional-language speech may be inconvenient to convert manually into written reports.
- Issue descriptions may lack important information.
- Administrators may struggle to identify urgent and recurring problems.
- There may be no reliable record of when an issue was reported, assigned, or resolved.
- Management may lack accurate operational statistics.

VoiceOps aims to reduce these problems by converting voice reports into structured records and providing a transparent tracking workflow.

## 1.3 Proposed Solution

The application will provide:

1. Browser-based voice recording.
2. Gnani AI speech-to-text integration.
3. Editable transcript review.
4. Automatic extraction of issue information.
5. Validation of missing or uncertain fields.
6. Unique ticket creation.
7. Ticket status and assignment management.
8. An administrative dashboard.
9. Operational analytics based on actual database records.
10. A deployable demonstration with testable end-to-end functionality.

## 1.4 Target Users

**Primary target:** College IT support and maintenance teams.

Secondary target users include:

- Apartment maintenance teams.
- Small business facility managers.
- Office IT support teams.
- Campus administrators.

The initial MVP will focus on college IT and maintenance complaints. Support for other organizations should use the same configurable ticket workflow rather than separate applications.

---

# 2. Product Goals and Non-Goals

## 2.1 Goals

- Enable users to report problems without typing a long description.
- Support voice transcription through an available Gnani AI API.
- Convert transcripts into structured issue records.
- Prevent unconfirmed AI-generated details from silently becoming facts.
- Allow administrators to manage tickets from a single dashboard.
- Measure reporting and resolution activity using actual records.
- Demonstrate the practical value of Indian-language voice AI.
- Produce a reliable portfolio project with documented architecture, testing, and deployment.

## 2.2 Non-Goals for the MVP

The initial release will not include:

- Telephone numbers or inbound telephone calls.
- WhatsApp or SMS integration.
- Automatic emergency dispatch.
- Autonomous repair or payment processing.
- A general conversational AI assistant.
- Complex multi-organization billing.
- Native Android or iOS applications.
- Automatic resolution of reported problems.
- Predictive AI claims without validated data.
- Guaranteed support for every Indian language, dialect, or noisy environment.

These features may be considered after the core workflow has been validated.

---

# 3. Core User Workflow

The primary workflow is:

**Record → Transcribe → Review → Extract → Confirm → Submit → Manage → Resolve → Analyze**

### Step 1: Record a complaint
The user opens the VoiceOps website, selects the reporting language if necessary, and records a short complaint using a microphone.

### Step 2: Transcribe the recording
The backend submits the audio to the configured Gnani AI speech-to-text service. The returned transcript is displayed to the user.

### Step 3: Review the transcript
The user can correct transcription errors before the application extracts the issue details.

### Step 4: Extract structured fields
The application identifies information such as title, description, category, location, priority, and optional asset reference.

### Step 5: Confirm the issue
The user reviews the generated ticket information and confirms submission.

### Step 6: Create a ticket
The backend validates the request, saves the ticket, and generates a unique ticket identifier (e.g. `VO-1001`).

### Step 7: Manage the ticket
An authorized administrator can assign the ticket, change its status, add an internal note, and record the resolution.

### Step 8: Analyze the data
The dashboard calculates issue counts, status distributions, category frequencies, and resolution metrics from saved records.

---

# 4. Functional Requirements

## FR-01: Voice Recording
Browser microphone recording, elapsed time, start/stop/replay/discard, format validation.

## FR-02: Speech-to-Text Integration
Secure backend integration with Gnani AI STT service, error handling, mock fallback option.

## FR-03: Transcript Editing
Editable text field, preserving original and reviewed transcript.

## FR-04: Issue Information Extraction
Title, description, category, location, priority, missing fields flag, confidence.

## FR-05: Ticket Creation
Unique ticket ID (`VO-1001`), database persistence, initial status `Open`.

## FR-06: Ticket Management
Admin ticket listing, details, status lifecycle (`Open → In Progress → Resolved → Closed`), assignment, internal notes, resolution notes, status history.

## FR-07: Dashboard and Analytics
Summary stats, status/category/priority distributions, trends, average resolution time, overdue counts. Real DB data only.

## FR-08: Authentication and Authorization
Role-based access: Reporter vs Administrator.

## FR-09: Error Handling
Graceful recovery for mic denial, network drops, transcription errors, invalid payloads.

## FR-10: Privacy and Data Management
Audio consent notice, raw audio minimization, environment variable security, data deletion for testing.

---

# 5. Non-Functional Requirements
- Performance, Reliability, Accessibility & Usability (desktop & mobile), Maintainability, Security.

---

# 6. Technical Architecture
- Frontend: Responsive Web UI (Next.js or FastAPI static/dynamic template app)
- Backend: FastAPI (Python 3.11)
- Database: SQLite (local MVP) / PostgreSQL (production) with SQLAlchemy
- AI: Gnani AI Speech-to-Text API + Rule-based / LLM Issue Extraction
