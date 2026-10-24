import { Painting } from '../models/Painting.js';

export const getPaintings = async (req, res, next) => {
  try {
    const { availableOnly } = req.query;
    const filter = {};
    if (availableOnly === 'true') {
      filter.isAvailable = true;
    }

    const paintings = await Painting.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: paintings.length,
      paintings,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaintingById = async (req, res, next) => {
  try {
    const painting = await Painting.findById(req.params.id);
    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found.',
      });
    }

    res.status(200).json({
      success: true,
      painting,
    });
  } catch (error) {
    next(error);
  }
};

export const addPainting = async (req, res, next) => {
  try {
    const { title, description, price, medium, dimensions, imageUrl } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and price are required.',
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than zero.',
      });
    }

    const painting = await Painting.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      medium: medium ? medium.trim() : 'Oil on Canvas',
      dimensions: dimensions ? dimensions.trim() : '24" x 36"',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      isAvailable: true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Painting added successfully.',
      painting,
    });
  } catch (error) {
    next(error);
  }
};

export const editPainting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const painting = await Painting.findById(id);

    if (!painting) {
      return res.status(404).json({
        success: false,
        message: 'Painting not found.',
      });
    }

    // Business rule: The studio/admin can edit a painting ONLY while it is available.
    if (!painting.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit this painting because it has already been purchased/reserved.',
      });
    }

    const { title, description, price, medium, dimensions, imageUrl } = req.body;

    if (title) painting.title = title.trim();
    if (description) painting.description = description.trim();
    if (price !== undefined) {
      if (Number(price) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than zero.',
        });
      }
      painting.price = Number(price);
    }
    if (medium) painting.medium = medium.trim();
    if (dimensions) painting.dimensions = dimensions.trim();
    if (imageUrl !== undefined) painting.imageUrl = imageUrl.trim();

    await painting.save();

    res.status(200).json({
      success: true,
      message: 'Painting updated successfully.',
      painting,
    });
  } catch (error) {
    next(error);
  }
};
