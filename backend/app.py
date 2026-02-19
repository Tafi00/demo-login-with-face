import os
import json
import base64
import sqlite3
import numpy as np
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition

app = Flask(__name__)

# CORS: cho phép frontend truy cập API
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
if allowed_origins != "*":
    origins = [o.strip() for o in allowed_origins.split(",")]
else:
    origins = "*"
CORS(app, origins=origins)

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            face_encoding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def decode_base64_image(base64_string):
    """Decode a base64 image string to a numpy array for face_recognition."""
    # Remove data URL prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]

    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    return np.array(image)


@app.route("/api/register", methods=["POST"])
def register():
    """Register a new user with their name and face image."""
    data = request.get_json()

    if not data or "name" not in data or "image" not in data:
        return jsonify({"success": False, "message": "Thiếu tên hoặc ảnh khuôn mặt"}), 400

    name = data["name"].strip()
    if not name:
        return jsonify({"success": False, "message": "Tên không được để trống"}), 400

    try:
        # Decode image and find face encodings
        image_array = decode_base64_image(data["image"])
        face_encodings = face_recognition.face_encodings(image_array)

        if len(face_encodings) == 0:
            return jsonify({
                "success": False,
                "message": "Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng trong khung hình."
            }), 400

        if len(face_encodings) > 1:
            return jsonify({
                "success": False,
                "message": "Phát hiện nhiều khuôn mặt. Chỉ nên có một người trong khung hình."
            }), 400

        # Store the face encoding
        encoding = face_encodings[0]
        encoding_json = json.dumps(encoding.tolist())

        conn = get_db()
        conn.execute(
            "INSERT INTO users (name, face_encoding) VALUES (?, ?)",
            (name, encoding_json)
        )
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Đăng ký thành công! Chào mừng {name}."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi xử lý ảnh: {str(e)}"
        }), 500


@app.route("/api/login", methods=["POST"])
def login():
    """Login by matching a face image against registered users."""
    data = request.get_json()

    if not data or "image" not in data:
        return jsonify({"success": False, "message": "Thiếu ảnh khuôn mặt"}), 400

    try:
        # Decode image and find face encodings
        image_array = decode_base64_image(data["image"])
        face_encodings = face_recognition.face_encodings(image_array)

        if len(face_encodings) == 0:
            return jsonify({
                "success": False,
                "message": "Không phát hiện khuôn mặt. Hãy đảm bảo khuôn mặt rõ ràng trong khung hình."
            }), 400

        login_encoding = face_encodings[0]

        # Get all registered users
        conn = get_db()
        users = conn.execute("SELECT id, name, face_encoding FROM users").fetchall()
        conn.close()

        if not users:
            return jsonify({
                "success": False,
                "message": "Chưa có người dùng nào đăng ký."
            }), 404

        # Compare with all stored encodings
        known_encodings = []
        known_names = []
        for user in users:
            encoding = np.array(json.loads(user["face_encoding"]))
            known_encodings.append(encoding)
            known_names.append(user["name"])

        # Use face_recognition to compare
        matches = face_recognition.compare_faces(known_encodings, login_encoding, tolerance=0.5)
        face_distances = face_recognition.face_distance(known_encodings, login_encoding)

        if True in matches:
            # Find the best match (lowest distance)
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                matched_name = known_names[best_match_index]
                confidence = round((1 - face_distances[best_match_index]) * 100, 1)
                return jsonify({
                    "success": True,
                    "message": f"Đăng nhập thành công!",
                    "user": {
                        "name": matched_name,
                        "confidence": confidence
                    }
                })

        return jsonify({
            "success": False,
            "message": "Khuôn mặt không khớp với bất kỳ tài khoản nào."
        }), 401

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi xử lý ảnh: {str(e)}"
        }), 500


@app.route("/api/users", methods=["GET"])
def get_users():
    """Get list of registered users (without face data)."""
    conn = get_db()
    users = conn.execute("SELECT id, name, created_at FROM users").fetchall()
    conn.close()
    return jsonify({
        "users": [{"id": u["id"], "name": u["name"], "created_at": u["created_at"]} for u in users]
    })


@app.route("/api/users/<name>", methods=["DELETE"])
def delete_user(name):
    """Delete a user's registered face data by name."""
    conn = get_db()
    cursor = conn.execute("DELETE FROM users WHERE name = ?", (name,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()

    if deleted == 0:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy người dùng."
        }), 404

    return jsonify({
        "success": True,
        "message": f"Đã xoá dữ liệu của {name}."
    })


# Init DB khi module được load (cả gunicorn lẫn dev)
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Face Login Backend running on http://localhost:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)
