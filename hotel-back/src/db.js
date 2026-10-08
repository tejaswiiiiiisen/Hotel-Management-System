"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOM_COLUMNS = exports.db = void 0;
exports.query = query;
require("dotenv/config");
var promise_1 = require("mysql2/promise");
// Single shared MySQL connection pool for local database.
// `decimalNumbers: true` makes mysql2 return DECIMAL columns as JS numbers.
var poolConfig = {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "hotel_website",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
};
exports.db = promise_1.default.createPool(poolConfig);
// Thin helper: run a parameterised query and return just the rows.
function query(sql_1) {
    return __awaiter(this, arguments, void 0, function (sql, params) {
        var rows;
        if (params === void 0) { params = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.db.query(sql, params)];
                case 1:
                    rows = (_a.sent())[0];
                    return [2 /*return*/, rows];
            }
        });
    });
}
// Column list used everywhere a room is read, aliasing snake_case DB columns to
// the camelCase shape the API and React components expect. mysql2 parses JSON
// columns (images / amenities / policies) back into real arrays for us.
exports.ROOM_COLUMNS = "\n  id,\n  room_uid           AS roomUid,\n  org_id             AS orgId,\n  org_name           AS orgName,\n  name,\n  slug,\n  type,\n  room_number        AS roomNumber,\n  floor,\n  room_view          AS roomView,\n  badge,\n  is_popular         AS isPopular,\n  short_description  AS shortDescription,\n  description,\n  price_per_night    AS pricePerNight,\n  capacity,\n  size_sqm           AS sizeSqm,\n  beds,\n  images,\n  amenities,\n  policies,\n  rating,\n  reviews_count      AS reviewsCount,\n  available,\n  status,\n  is_deleted         AS isDeleted,\n  created_at         AS createdAt,\n  updated_at         AS updatedAt\n";
