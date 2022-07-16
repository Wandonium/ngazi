const mongodb = require("mongodb")
const logger = require('../util/logger');
const ObjectId = mongodb.ObjectId;

let users

class UsersDAO {
  static async injectDB(conn) {
    if (users) {
      return
    }
    try {
      users = await conn.db(process.env.NGAZI_NS).collection("users")
    } catch (e) {
      logger.error(
        `Unable to establish a connection to the users collection in usersDAO: ${e}`
      )
    }
  }

  static async addUser(data) {
    const {
      firstName,
      lastName,
      profileProvider,
      providerId,
      email,
      picture,
      macAddress,
      ipAddress,
    } = data
    try {
      const userDoc = {
        first_name: firstName,
        last_name: lastName,
        provider: profileProvider,
        provider_id: providerId,
        mac_addresses: [macAddress],
        current_ip_address: ipAddress,
        email,
        picture_url: picture,
      }
      return await users.insertOne(userDoc)
    } catch (e) {
      logger.error(`Unable to create new user: ${e}`)
      return { error: e }
    }
  }

  static async getUsers({ filters, page = 0, usersPerPage = 20 } = {}) {
    let query = {};
    if (filters) {
      if ("name" in filters) {
        query = { $text: { $search: filters["name"] } }
      } else if ("macAddress" in filters) {
        query = { mac_addresses: filters['macAddress'] }
      } else if ("email" in filters) {
        query = { email: { $eq: filters["email"] } }
      } else if ("providerId" in filters) {
        query = { provider_id: { $eq: filters["providerId"] } }
      }
    }

    let cursor
    try {
      cursor = await users.find(query)
    } catch (e) {
      logger.error(`Unable to find users in db: ${e}`)
      return { usersList: [], totalNumUsers: 0 }
    }

    const displayCursor = cursor.limit(usersPerPage).skip(usersPerPage * page)

    try {
      const usersList = await displayCursor.toArray()
      const totalNumUsers = await users.countDocuments(query)
      return { usersList, totalNumUsers }
    } catch (e) {
      logger.error(
        `Unable to convert cursor to array or problem counting user documents: ${e}`
      )
      return { usersList: [], totalNumUsers: 0 }
    }
  }

  static async getUsersById(id) {
    try {
      const pipeline = [
        {
          $match: {
            _id: new ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "adviews",
            let: {
              id: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$user_id", "$$id"],
                  },
                },
              },
              {
                $sort: {
                  viewed_at: -1,
                },
              },
            ],
            as: "adviews",
          },
        },
        {
          $addFields: {
            adviews: "$adviews",
          },
        },
      ]
      return await users.aggregate(pipeline).next()
    } catch (e) {
      logger.error(`Something went wrong in getUsersById: ${e}`)
      throw e
    }
  }

  static async updateUser(updatedUser) {
    try {
      const updateResponse = await users.updateOne(
        { _id: ObjectId(updatedUser._id) },
        {
          $set: {
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            provider: updatedUser.provider,
            provider_id: updatedUser.provider_id,
            mac_addresses: updatedUser.mac_addresses,
            current_ip_address: updatedUser.current_ip_address,
            email: updatedUser.email,
            picture_url: updatedUser.picture_url,
          },
        }
      )
      return updateResponse
    } catch (e) {
      logger.error(`Unable to update user: ${e}`)
      return { error: e }
    }
  }

  static async deleteUser(userId) {
    try {
      const deleteResponse = await users.deleteOne({ _id: ObjectId(userId) })
      return deleteResponse
    } catch (e) {
      logger.error(`Unable to delete user: ${e}`)
      return { error: e }
    }
  }
}

module.exports = UsersDAO
