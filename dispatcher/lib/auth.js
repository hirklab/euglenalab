
function authorize (auth, config, callback) {
  let error= null;

  if (auth === null || !auth.hasOwnProperty('Identifier') || auth.Identifier.length <= 0) {
    error = new Error('missing auth identity');
    return callback(error);

  } else {
    let ref = auth.Identifier;

    if (!(ref in config.authenticClients)) {
      error = new Error('incorrect auth');
      return callback(error);
    }
  }

  return callback(null);
}

export {authorize};
