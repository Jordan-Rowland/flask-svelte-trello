import datetime

from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from flask import current_app, url_for
# from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from server import db


# @login_manager.user_loader
# def load_user(user_id):
#     return User.query.get(int(user_id))


# Timezone adjustments
def now():
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)

def astimezone(d, offset):
    return d.astimezone(datetime.timezone(datetime.timedelta(hours=offset)))

def PDTNow():
    return str(astimezone(now(), -7))

def PSTNow():
    return str(astimezone(now(), -8))


class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer(), primary_key=True)
    body = db.Column(db.Text(), index=True, nullable=False)
    timestamp = db.Column(db.Text(), nullable=False, default=PSTNow)
    list_id = db.Column(db.Integer(), db.ForeignKey("lists.id"))


    def __init__(self, body, list_id):
        self.body = body
        self.list_id = list_id

    def to_json(self):
        json_note = {
            "id": self.id,
            "body": self.body,
            "list_id": self.list_id,
            "timestamp": self.timestamp,
        }
        return json_note

    @staticmethod
    def from_json(json_note):
        body = json_note.get('body')
        list_id = json_note.get('list_id')
        if (
                body is None
                or list_id is None
                or body == ''
                or list_id == ''
            ):
            raise Exception('Note does not have a body or list_id')
        return Note(body=body, list_id=list_id)


class List(db.Model):
    __tablename__ = 'lists'

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.Text(), index=True, nullable=False)
    notes = db.relationship("Note", backref="list")
    # user_id = db.Column(db.Integer(), db.ForeignKey("users.id"))


    def __init__(self, name):
        self.name = name

    def to_json(self):
        json_list = {
            "id": self.id,
            "name": self.name,
            # "user_id": self.user_id,
        }
        return json_list

    @staticmethod
    def from_json(json_list):
        name = json_list.get('name')
        if name is None or name == '':
            raise Exception('List does not have a name')
        return List(name=name)


# class User(db.Model, UserMixin):
#     __tablename__ = 'users'

#     id = db.Column(db.Integer(), primary_key=True)
#     email = db.Column(db.String(64), unique=True, index=True, nullable=False)
#     password_hash = db.Column(db.String(128), nullable=False)
#     lists = db.relationship("List", backref="user")


#     def __init__(self, email, password):
#         self.email = email.lower()
#         self.password_hash = generate_password_hash(password)


#     def __repr__(self):
#         return f"User('{self.id}', '{self.username}', '{self.email}')"


#     def check_password(self, password):
#         return check_password_hash(self.password_hash, password)


#     def generate_confirmation_token(self, expiration=3600):
#         s = Serializer(current_app.config['SECRET_KEY'],
#             expiration)
#         return s.dumps({'confirm': self.id}).decode('utf-8')


#     def generate_reset_token(self, expiration=3600):
#         s = Serializer(current_app.config['SECRET_KEY'], expiration)
#         return s.dumps({'reset': self.id}).decode('utf-8')


#     @staticmethod
#     def reset_password(token, new_password):
#         s = Serializer(current_app.config['SECRET_KEY'])
#         try:
#             data = s.loads(token.encode('utf-8'))
#         except Exception:
#             return False
#         user = User.query.get(data.get('reset'))
#         if user is None:
#             return False
#         user.password_hash = generate_password_hash(new_password)
#         db.session.add(user)
#         db.session.commit()
#         return True


#     def generate_auth_token(self, expiration):
#         s = Serializer(current_app.config['SECRET_KEY'],
#                        expires_in=expiration)
#         return s.dumps({"id": self.id}).decode('utf-8')


#     @staticmethod
#     def verify_auth_token(token):
#         s = Serializer(current_app.config['SECRET_KEY'])
#         try:
#             data = s.loads(token)
#         except Exception:
#             return None
#         return User.query.get(data['id'])


#     @staticmethod
#     def from_json(json_user):
#         email = json_user.get('email')
#         password = json_user.get('password')
#         if (
#                 email is None
#                 or password is None
#                 or email == ''
#                 or password == ''
#             ):
#             raise Exception('User does not have an email or password')
#         return User(email=email, password=password)
