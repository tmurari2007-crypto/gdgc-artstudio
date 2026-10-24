import {
  PotteryRequest,
  VALID_POTTERY_ITEMS,
  VALID_GLAZE_OPTIONS,
} from '../models/PotteryRequest.js';

/**
 * Helper to validate needed-by date:
 * Must be at least 14 days in the future.
 */
export const validatePotteryDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, message: 'Invalid date format. Use YYYY-MM-DD.' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetDate - todayUTC) / msPerDay);

  if (diffDays < 14) {
    return {
      valid: false,
      message: `Needed-by date must be at least 14 days in the future (Selected is ${diffDays} days away).`,
      diffDays,
    };
  }

  return { valid: true, diffDays };
};

/**
 * Public catalog endpoint to get valid pottery items and glaze options
 */
export const getPotteryCatalog = async (req, res) => {
  res.status(200).json({
    success: true,
    items: VALID_POTTERY_ITEMS,
    glazes: VALID_GLAZE_OPTIONS,
  });
};

/**
 * Create a new pottery request
 * Requirements:
 * - Customer chooses item from seed catalog
 * - Customer chooses glaze from seed catalog
 * - Quantity: 1 to 12 inclusive
 * - Needed-by date: at least 14 days away
 * - Initial status: 'requested'
 */
export const createPotteryRequest = async (req, res, next) => {
  try {
    const { item, glaze, quantity, neededBy, specialNotes } = req.body;

    if (!item || !glaze || quantity === undefined || !neededBy) {
      return res.status(400).json({
        success: false,
        message: 'Item, glaze, quantity, and needed-by date are required.',
      });
    }

    if (!VALID_POTTERY_ITEMS.includes(item.trim())) {
      return res.status(400).json({
        success: false,
        message: `Invalid pottery item. Choose from: ${VALID_POTTERY_ITEMS.join(', ')}`,
      });
    }

    if (!VALID_GLAZE_OPTIONS.includes(glaze.trim())) {
      return res.status(400).json({
        success: false,
        message: `Invalid glaze option. Choose from: ${VALID_GLAZE_OPTIONS.join(', ')}`,
      });
    }

    const numQuantity = Number(quantity);
    if (!Number.isInteger(numQuantity) || numQuantity < 1 || numQuantity > 12) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer between 1 and 12 inclusive.',
      });
    }

    const dateCheck = validatePotteryDate(neededBy.trim());
    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: dateCheck.message,
      });
    }

    const request = await PotteryRequest.create({
      customer: req.user._id,
      item: item.trim(),
      glaze: glaze.trim(),
      quantity: numQuantity,
      neededBy: neededBy.trim(),
      specialNotes: specialNotes ? specialNotes.trim() : '',
      status: 'requested',
    });

    const populated = await PotteryRequest.findById(request._id).populate(
      'customer',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: 'Custom pottery request submitted successfully!',
      request: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View Customer's own pottery requests
 */
export const getMyPotteryRequests = async (req, res, next) => {
  try {
    const requests = await PotteryRequest.find({ customer: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View all pottery requests as admin
 */
export const getAllPotteryRequests = async (req, res, next) => {
  try {
    const requests = await PotteryRequest.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer edit pottery request
 * Business rules:
 * - Customers can edit ONLY requests that remain 'requested'.
 * - Accepted, declined, or cancelled requests CANNOT be edited.
 * - Customer accessing another customer's record gets 404.
 */
export const editPotteryRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await PotteryRequest.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pottery request not found.',
      });
    }

    // Business rule: Customers can edit or cancel only while it is still requested
    if (request.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `This request is already '${request.status}' and cannot be edited.`,
      });
    }

    const { item, glaze, quantity, neededBy, specialNotes } = req.body;

    if (item) {
      if (!VALID_POTTERY_ITEMS.includes(item.trim())) {
        return res.status(400).json({
          success: false,
          message: `Invalid pottery item. Choose from: ${VALID_POTTERY_ITEMS.join(', ')}`,
        });
      }
      request.item = item.trim();
    }

    if (glaze) {
      if (!VALID_GLAZE_OPTIONS.includes(glaze.trim())) {
        return res.status(400).json({
          success: false,
          message: `Invalid glaze option. Choose from: ${VALID_GLAZE_OPTIONS.join(', ')}`,
        });
      }
      request.glaze = glaze.trim();
    }

    if (quantity !== undefined) {
      const numQuantity = Number(quantity);
      if (!Number.isInteger(numQuantity) || numQuantity < 1 || numQuantity > 12) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be an integer between 1 and 12 inclusive.',
        });
      }
      request.quantity = numQuantity;
    }

    if (neededBy) {
      const dateCheck = validatePotteryDate(neededBy.trim());
      if (!dateCheck.valid) {
        return res.status(400).json({
          success: false,
          message: dateCheck.message,
        });
      }
      request.neededBy = neededBy.trim();
    }

    if (specialNotes !== undefined) {
      request.specialNotes = specialNotes.trim();
    }

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Pottery request updated successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer cancel pottery request
 * Business rules:
 * - Customers can cancel ONLY requests that remain 'requested'.
 * - Accepted, declined, or cancelled requests CANNOT be cancelled.
 * - Customer accessing another customer's record gets 404.
 */
export const cancelPotteryRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await PotteryRequest.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pottery request not found.',
      });
    }

    if (request.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a pottery request that is already '${request.status}'.`,
      });
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Pottery request cancelled successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Accept pottery request
 */
export const acceptPotteryRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await PotteryRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pottery request not found.',
      });
    }

    if (request.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a pottery request that is currently '${request.status}'.`,
      });
    }

    request.status = 'accepted';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Pottery request accepted by the studio.',
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Decline pottery request
 */
export const declinePotteryRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await PotteryRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pottery request not found.',
      });
    }

    if (request.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline a pottery request that is currently '${request.status}'.`,
      });
    }

    request.status = 'declined';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Pottery request declined.',
      request,
    });
  } catch (error) {
    next(error);
  }
};
