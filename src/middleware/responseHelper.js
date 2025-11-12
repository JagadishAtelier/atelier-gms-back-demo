
const responseHelper = (req, res, next) => {
  res.sendSuccess = (data = {}, message = 'Success', meta = null) => {
    const response = {
      status: 'success',
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    res.status(200).json(response);
  };

  res.sendError = (message = 'Internal Server Error', statusCode = 500, errors = null, meta = null) => {
    const response = {
      status: 'error',
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    if (meta) {
      response.meta = meta;
    }

    res.status(statusCode).json(response);
  };

  next();
};

export default responseHelper;


