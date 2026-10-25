const pdfParse = require("pdf-parse");

const {
    generateInterviewReport,
    generateResumePdf
} = require("../services/ai.service");

const interviewReportModel = require("../models/report.model");

async function generateReportController(req, res) {
    try {
        
const { selfDescription, jobDescription } = req.body;

// Validate job description
if (!jobDescription?.trim()) {
    return res.status(400).json({
        success: false,
        message: "Please provide a job description."
    });
}

// Require either a resume or a self-description
if ((!req.file || !req.file.buffer) && !selfDescription?.trim()) {
    return res.status(400).json({
        success: false,
        message: "Please upload a resume or enter a self-description."
    });
}

// Extract resume text only when a resume is uploaded
let resumeText = "";

if (req.file?.buffer) {
    if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
            success: false,
            message: "Please upload your resume as a PDF."
        });
    }

    const parsedPdf = await new pdfParse.PDFParse(
        Uint8Array.from(req.file.buffer)
    ).getText();

    resumeText = parsedPdf.text || "";

    if (!resumeText.trim()) {
        return res.status(400).json({
            success: false,
            message: "No readable text was found in the PDF. Please upload a text-based PDF."
        });
    }
}

        // Generate report using Gemini
        const interviewReportData = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // Save report
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportData
        });

        return res.status(200).json({
            success: true,
            message: "Interview report generated successfully",
            interviewReport
        });

    } catch (error) {
        console.error("Interview report generation failed:", error);

        if (error.status === 503 || error.code === 503 ||
            error.message?.includes('"code":503') ||
            error.message?.includes("UNAVAILABLE")) {
            return res.status(503).json({
                success: false,
                message: "The AI service is temporarily busy. Please try again in a moment."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate the interview report. Please try again."
        });
    }
}

/**
 * Get an interview report by ID.
 * GET /api/interview/:interviewId
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Interview report fetched successfully.",
            interviewReport
        });
    } catch (error) {
        console.error("Failed to fetch interview report:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch the interview report."
        });
    }
}

/**
 * Get all interview reports for the logged-in user.
 * GET /api/interview/
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select(
                "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
            );

        return res.status(200).json({
            success: true,
            message: "Interview reports fetched successfully.",
            interviewReports
        });
    } catch (error) {
        console.error("Failed to fetch interview reports:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch interview reports."
        });
    }
}

/**
 * Generate a tailored resume PDF.
 * Uses the existing route parameter: interviewReportId.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            });
        }

        const {
            resume,
            jobDescription,
            selfDescription
        } = interviewReport;

        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        });

        return res.send(pdfBuffer);

    } catch (error) {
        console.error("Resume PDF generation failed:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate the resume PDF. Please try again."
        });
    }
}

module.exports = {
    generateReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
};