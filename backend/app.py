from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import re
import os
import jwt
import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return "Backend is running ✅"

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:MySql%40123@localhost/dibs'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dibs_secret_key_change_in_production'

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

db = SQLAlchemy(app)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def token_required(f):
    """JWT authentication decorator."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


def admin_required(f):
    """Admin-only decorator (must be used after @token_required pattern)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user or not current_user.is_admin:
                return jsonify({'message': 'Admin access required'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    items = db.relationship('Item', backref='owner', lazy=True)
    bookings_made = db.relationship('Booking', foreign_keys='Booking.renter_id', backref='renter', lazy=True)
    feedbacks_given = db.relationship('Feedback', backref='reviewer', lazy=True)


class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    items = db.relationship('Item', backref='category', lazy=True)


class Item(db.Model):
    __tablename__ = 'items'
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    item_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    item_condition = db.Column(db.Enum('New', 'Good', 'Used'), default='Good')
    deposit_amount = db.Column(db.Numeric(10, 2), default=0.00)
    rental_price_per_day = db.Column(db.Numeric(10, 2), default=0.00)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    images = db.relationship('ItemImage', backref='item', lazy=True, cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='item', lazy=True)
    feedbacks = db.relationship('Feedback', backref='item', lazy=True)


class ItemImage(db.Model):
    __tablename__ = 'item_images'
    image_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.item_id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)


class Booking(db.Model):
    __tablename__ = 'bookings'
    booking_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.item_id'), nullable=False)
    renter_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'), default='Pending')
    total_cost = db.Column(db.Numeric(10, 2), default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class Feedback(db.Model):
    __tablename__ = 'feedbacks'
    feedback_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.item_id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1–5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


with app.app_context():
    db.create_all()
    # Seed default categories if empty
    if Category.query.count() == 0:
        default_categories = [
            'Electronics', 'Tools & Equipment', 'Furniture',
            'Sports & Outdoors', 'Books & Media', 'Clothing',
            'Kitchen & Appliances', 'Vehicles', 'Garden & Outdoor', 'Other'
        ]
        for name in default_categories:
            db.session.add(Category(name=name))
        db.session.commit()
    # Seed admin user if none exists
    if not User.query.filter_by(is_admin=True).first():
        admin = User(
            full_name='Admin',
            email='admin@dibs.com',
            phone='0000000000',
            password_hash=generate_password_hash('Admin@123'),
            address='DIBS HQ',
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

# Auth Routes

@app.route('/register', methods=['POST'])
def register():
    data = request.json

    # Validate required fields
    required_fields = ['fullName', 'email', 'phone', 'password', 'address']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'message': f'Missing field: {field}'}), 400

    password = data['password']
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$', password):
        return jsonify({
            'message': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character'
        }), 400

    phone = data['phone']
    if not re.match(r'^\d{10}$', phone):
        return jsonify({'message': 'Phone number must be exactly 10 digits'}), 400

    email = data['email'].lower().strip()
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        return jsonify({'message': 'Invalid email address'}), 400

    existing_user = User.query.filter(
        (User.email == email) | (User.phone == phone)
    ).first()

    if existing_user:
        return jsonify({'message': 'User with this email or phone already exists'}), 400

    new_user = User(
        full_name=data['fullName'].strip(),
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        address=data['address'].strip()
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully!'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json

    if not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email'].lower().strip()).first()

    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({
            'user_id': user.user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user_id': user.user_id,
            'full_name': user.full_name,
            'is_admin': user.is_admin
        })

    return jsonify({'message': 'Invalid email or password'}), 401

# User Routes

@app.route('/user/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def manage_user(current_user, id):
    # Only the user themselves or admin can access
    if current_user.user_id != id and not current_user.is_admin:
        return jsonify({'message': 'Unauthorized'}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'user_id': user.user_id,
            'full_name': user.full_name,
            'email': user.email,
            'phone': user.phone,
            'address': user.address,
            'is_admin': user.is_admin,
            'created_at': user.created_at.isoformat() if user.created_at else None
        })

    if request.method == 'PUT':
        data = request.json
        user.full_name = data.get('fullName', user.full_name)
        user.address = data.get('address', user.address)
        if data.get('phone'):
            if not re.match(r'^\d{10}$', data['phone']):
                return jsonify({'message': 'Phone number must be exactly 10 digits'}), 400
            user.phone = data['phone']
        db.session.commit()
        return jsonify({'message': 'User updated successfully'})

    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'Account deleted successfully'})


@app.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'user_id': current_user.user_id,
        'full_name': current_user.full_name,
        'email': current_user.email,
        'phone': current_user.phone,
        'address': current_user.address,
        'is_admin': current_user.is_admin
    })

# Category Routes

@app.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([{'id': c.category_id, 'name': c.name} for c in categories])


@app.route('/categories', methods=['POST'])
@admin_required
def add_category(current_user):
    data = request.json
    if not data.get('name'):
        return jsonify({'message': 'Category name is required'}), 400
    existing = Category.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'message': 'Category already exists'}), 400
    new_cat = Category(name=data['name'])
    db.session.add(new_cat)
    db.session.commit()
    return jsonify({'message': 'Category added', 'id': new_cat.category_id}), 201

# Item Routes

def item_to_dict(item, include_owner=False):
    """Serialize an Item model to dict."""
    data = {
        'item_id': item.item_id,
        'item_name': item.item_name,
        'description': item.description,
        'item_condition': item.item_condition,
        'deposit_amount': float(item.deposit_amount) if item.deposit_amount else 0,
        'rental_price_per_day': float(item.rental_price_per_day) if item.rental_price_per_day else 0,
        'is_available': item.is_available,
        'category_id': item.category_id,
        'category_name': item.category.name if item.category else None,
        'user_id': item.user_id,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'images': [f'/uploads/{os.path.basename(img.image_path)}' for img in item.images],
        'avg_rating': None,
        'review_count': len(item.feedbacks)
    }
    if item.feedbacks:
        data['avg_rating'] = round(sum(f.rating for f in item.feedbacks) / len(item.feedbacks), 1)
    if include_owner and item.owner:
        data['owner_name'] = item.owner.full_name
    return data


@app.route('/items', methods=['GET'])
def get_items():
    """Browse all items with optional search and filter."""
    query = Item.query.filter_by(is_available=True)

    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            (Item.item_name.ilike(f'%{search}%')) |
            (Item.description.ilike(f'%{search}%'))
        )

    category_id = request.args.get('category_id')
    if category_id:
        query = query.filter_by(category_id=int(category_id))

    condition = request.args.get('condition')
    if condition:
        query = query.filter_by(item_condition=condition)

    items = query.order_by(Item.created_at.desc()).all()
    return jsonify([item_to_dict(i, include_owner=True) for i in items])


@app.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    return jsonify(item_to_dict(item, include_owner=True))


@app.route('/items/my', methods=['GET'])
@token_required
def get_my_items(current_user):
    items = Item.query.filter_by(user_id=current_user.user_id).order_by(Item.created_at.desc()).all()
    return jsonify([item_to_dict(i) for i in items])


@app.route('/add_item', methods=['POST'])
@token_required
def add_item(current_user):
    try:
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        condition = request.form.get('condition', 'Good')
        deposit_str = request.form.get('deposit', '0')
        rental_price_str = request.form.get('rental_price', '0')
        category_id_str = request.form.get('category_id', '1')

        if not name:
            return jsonify({'message': 'Item name is required'}), 400

        # Validate condition
        if condition not in ['New', 'Good', 'Used']:
            return jsonify({'message': 'Invalid condition value'}), 400

        try:
            deposit = float(deposit_str)
            rental_price = float(rental_price_str)
            category_id = int(category_id_str)
        except ValueError:
            return jsonify({'message': 'Invalid numeric value'}), 400

        # Validate category exists
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'message': 'Invalid category'}), 400

        new_item = Item(
            user_id=current_user.user_id,  # FIX: use authenticated user
            category_id=category_id,
            item_name=name,
            description=description,
            item_condition=condition,
            deposit_amount=deposit,
            rental_price_per_day=rental_price
        )

        db.session.add(new_item)
        db.session.commit()

        # Handle image uploads
        images = request.files.getlist('images')
        for image in images:
            if image and image.filename and allowed_file(image.filename):
                filename = secure_filename(f"{new_item.item_id}_{image.filename}")
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image.save(image_path)
                new_image = ItemImage(item_id=new_item.item_id, image_path=image_path)
                db.session.add(new_image)

        db.session.commit()
        return jsonify({'message': 'Item listed successfully!', 'item_id': new_item.item_id}), 201

    except Exception as e:
        db.session.rollback()
        print('ERROR adding item:', e)
        return jsonify({'message': 'Error adding item', 'error': str(e)}), 500


@app.route('/items/<int:item_id>', methods=['PUT'])
@token_required
def update_item(current_user, item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    if item.user_id != current_user.user_id and not current_user.is_admin:
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.json
    item.item_name = data.get('item_name', item.item_name)
    item.description = data.get('description', item.description)
    item.item_condition = data.get('item_condition', item.item_condition)
    item.deposit_amount = data.get('deposit_amount', item.deposit_amount)
    item.rental_price_per_day = data.get('rental_price_per_day', item.rental_price_per_day)
    item.is_available = data.get('is_available', item.is_available)
    item.category_id = data.get('category_id', item.category_id)

    db.session.commit()
    return jsonify({'message': 'Item updated successfully'})


@app.route('/items/<int:item_id>', methods=['DELETE'])
@token_required
def delete_item(current_user, item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    if item.user_id != current_user.user_id and not current_user.is_admin:
        return jsonify({'message': 'Unauthorized'}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted successfully'})

# Booking Routes

@app.route('/bookings', methods=['POST'])
@token_required
def create_booking(current_user):
    data = request.json

    required = ['item_id', 'start_date', 'end_date']
    for field in required:
        if not data.get(field):
            return jsonify({'message': f'Missing field: {field}'}), 400

    item = Item.query.get(data['item_id'])
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    if not item.is_available:
        return jsonify({'message': 'Item is not available'}), 400
    if item.user_id == current_user.user_id:
        return jsonify({'message': 'You cannot book your own item'}), 400

    try:
        start = datetime.date.fromisoformat(data['start_date'])
        end = datetime.date.fromisoformat(data['end_date'])
    except ValueError:
        return jsonify({'message': 'Invalid date format (use YYYY-MM-DD)'}), 400

    if end <= start:
        return jsonify({'message': 'End date must be after start date'}), 400

    days = (end - start).days
    total_cost = days * float(item.rental_price_per_day)

    # Check for overlapping bookings
    overlap = Booking.query.filter(
        Booking.item_id == item.item_id,
        Booking.status.in_(['Pending', 'Approved']),
        Booking.start_date < end,
        Booking.end_date > start
    ).first()
    if overlap:
        return jsonify({'message': 'Item is already booked for those dates'}), 400

    booking = Booking(
        item_id=item.item_id,
        renter_id=current_user.user_id,
        start_date=start,
        end_date=end,
        total_cost=total_cost
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({
        'message': 'Booking request submitted!',
        'booking_id': booking.booking_id,
        'total_cost': total_cost
    }), 201


@app.route('/bookings/my', methods=['GET'])
@token_required
def get_my_bookings(current_user):
    """Bookings the current user made as a renter."""
    bookings = Booking.query.filter_by(renter_id=current_user.user_id).order_by(Booking.created_at.desc()).all()
    return jsonify([booking_to_dict(b) for b in bookings])


@app.route('/bookings/owner', methods=['GET'])
@token_required
def get_owner_bookings(current_user):
    """Bookings for items the current user owns."""
    my_item_ids = [i.item_id for i in Item.query.filter_by(user_id=current_user.user_id).all()]
    bookings = Booking.query.filter(
        Booking.item_id.in_(my_item_ids)
    ).order_by(Booking.created_at.desc()).all()
    return jsonify([booking_to_dict(b, include_renter=True) for b in bookings])


@app.route('/bookings/<int:booking_id>/status', methods=['PUT'])
@token_required
def update_booking_status(current_user, booking_id):
    """Owner approves/rejects; renter cancels."""
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'message': 'Booking not found'}), 404

    data = request.json
    new_status = data.get('status')
    item = Item.query.get(booking.item_id)

    # Renter can cancel their own booking
    if booking.renter_id == current_user.user_id:
        if new_status != 'Cancelled':
            return jsonify({'message': 'Renters can only cancel bookings'}), 403
    elif item.user_id == current_user.user_id:
        # Owner can approve/reject
        if new_status not in ['Approved', 'Rejected', 'Completed']:
            return jsonify({'message': 'Invalid status for owner'}), 400
    elif current_user.is_admin:
        pass  # Admin can do anything
    else:
        return jsonify({'message': 'Unauthorized'}), 403

    booking.status = new_status
    # Mark item unavailable when approved
    if new_status == 'Approved':
        item.is_available = False
    elif new_status in ['Completed', 'Cancelled', 'Rejected']:
        item.is_available = True

    db.session.commit()
    return jsonify({'message': f'Booking {new_status.lower()} successfully'})


def booking_to_dict(booking, include_renter=False):
    data = {
        'booking_id': booking.booking_id,
        'item_id': booking.item_id,
        'item_name': booking.item.item_name if booking.item else None,
        'start_date': booking.start_date.isoformat(),
        'end_date': booking.end_date.isoformat(),
        'status': booking.status,
        'total_cost': float(booking.total_cost) if booking.total_cost else 0,
        'created_at': booking.created_at.isoformat() if booking.created_at else None
    }
    if include_renter and booking.renter:
        data['renter_name'] = booking.renter.full_name
        data['renter_id'] = booking.renter_id
    return data

# Feedback Routes

@app.route('/feedback', methods=['POST'])
@token_required
def add_feedback(current_user):
    data = request.json

    required = ['item_id', 'rating']
    for field in required:
        if data.get(field) is None:
            return jsonify({'message': f'Missing field: {field}'}), 400

    rating = int(data['rating'])
    if not (1 <= rating <= 5):
        return jsonify({'message': 'Rating must be between 1 and 5'}), 400

    item = Item.query.get(data['item_id'])
    if not item:
        return jsonify({'message': 'Item not found'}), 404

    # Check user has a completed booking for this item
    completed_booking = Booking.query.filter_by(
        item_id=item.item_id,
        renter_id=current_user.user_id,
        status='Completed'
    ).first()
    if not completed_booking:
        return jsonify({'message': 'You can only review items you have rented'}), 403

    # Check no duplicate review
    existing = Feedback.query.filter_by(
        item_id=item.item_id,
        reviewer_id=current_user.user_id
    ).first()
    if existing:
        return jsonify({'message': 'You have already reviewed this item'}), 400

    feedback = Feedback(
        item_id=item.item_id,
        reviewer_id=current_user.user_id,
        rating=rating,
        comment=data.get('comment', '')
    )
    db.session.add(feedback)
    db.session.commit()
    return jsonify({'message': 'Feedback submitted!', 'feedback_id': feedback.feedback_id}), 201


@app.route('/feedback/<int:item_id>', methods=['GET'])
def get_item_feedback(item_id):
    feedbacks = Feedback.query.filter_by(item_id=item_id).order_by(Feedback.created_at.desc()).all()
    result = []
    for f in feedbacks:
        result.append({
            'feedback_id': f.feedback_id,
            'rating': f.rating,
            'comment': f.comment,
            'reviewer_name': f.reviewer.full_name if f.reviewer else 'Anonymous',
            'created_at': f.created_at.isoformat() if f.created_at else None
        })
    return jsonify(result)

# Admin Routes

@app.route('/admin/users', methods=['GET'])
@admin_required
def admin_get_users(current_user):
    users = User.query.all()
    return jsonify([{
        'user_id': u.user_id,
        'full_name': u.full_name,
        'email': u.email,
        'phone': u.phone,
        'is_admin': u.is_admin,
        'created_at': u.created_at.isoformat() if u.created_at else None
    } for u in users])


@app.route('/admin/stats', methods=['GET'])
@admin_required
def admin_stats(current_user):
    return jsonify({
        'total_users': User.query.count(),
        'total_items': Item.query.count(),
        'total_bookings': Booking.query.count(),
        'active_bookings': Booking.query.filter_by(status='Approved').count(),
        'pending_bookings': Booking.query.filter_by(status='Pending').count(),
        'total_feedback': Feedback.query.count()
    })

# Static File Serving

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Run

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
