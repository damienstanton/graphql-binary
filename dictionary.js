import { graphql } from 'graphql'
import reduce from 'lodash/fp/reduce'
import forEach from 'lodash/fp/forEach'
import get from 'lodash/fp/get'

export default schema =>
  graphql(schema, query)
    .then(get('data.__schema.types'))
    .then(reduce(typeReducer, { encode: {}, decode: {} }))

const typeReducer = (
  result,
{
  name,
  kind,
  enumValues,
  fields,
}) => {
  if (!name.match('__') && (kind === 'OBJECT' || kind === 'LIST')) {
    if (!result.decode[name])
      result.decode[name] = []

    if (!result.encode[name])
      result.encode[name] = {}

    forEach(field => {
      encodeWithList(field, result.decode[name])
      result.encode[name][field.name] = {
        byte: result.decode[name].length - 1
      }
      if (field.args.length > 0)
        forEach(arg => {
          result.encode[name][field.name].arguments = {}
          result.encode[name][field.name].arguments[arg.name] = {
            byte: result.decode[name].length - 1
          }
          encodeWithList(arg, result.decode[name])
        }, field.args)
    }, fields)
  }

  return result
}

const encodeWithList = ({ type, ...field }, result) =>
  result.push({
    name: field.name,
    ...type.kind === 'LIST'
      ? { kind: type.ofType.kind, type: type.ofType.name  }
      : { kind: type.kind, type: type.name }
  })

const query = `{
  __schema {
    types {	
      name
      kind
      enumValues {
      	name
      }
      fields {
        name
        args {
          name
          type {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
        type {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
}`