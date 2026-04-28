import * as profileService from "../services/profile.service.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { convertToCSV } from "../services/export.service.js";

export const postProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { data, isNew } = await profileService.createProfile(name);

    if (!isNew) {
      return successResponse(res, data, 200, {
        message: "Profile already exists",
      });
    }
    return successResponse(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileById(req.params.id);
    if (!profile) return errorResponse(res, "Profile not found", 404);
    return successResponse(res, profile);
  } catch (error) {
    next(error);
  }
};

export const getProfiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const validatedPage = parseInt(page);
    const validatedLimit = Math.min(parseInt(limit), 50);

    const result = await profileService.listProfiles({ 
      ...filters, 
      page: validatedPage, 
      limit: validatedLimit 
    });

    return res.status(200).json({
      status: "success",
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const searchProfiles = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ status: "error", message: "Missing or empty parameter" });

    const p = parseInt(page);
    const l = Math.min(parseInt(limit), 50);

    const result = await profileService.searchProfiles(q, { page: p, limit: l });

    // Exact JSON structure
    return res.status(200).json({
      status: "success",
      ...result // This now contains data, total, total_pages, and links
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    const deleted = await profileService.removeProfile(req.params.id);
    if (!deleted) return errorResponse(res, "Profile not found", 404);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const exportProfiles = async (req, res, next) => {
  try {
    const filters = req.query;
    // Identify the path for the model's link generator
    const { data } = await profileService.listProfiles({ ...filters, limit: 10000 }, "/api/profiles/export");
    
    const csv = convertToCSV(data);
    const timestamp = new Date().getTime();
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="profiles_${timestamp}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};