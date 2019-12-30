import os

from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    url_for,
)

from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)

from flask_sqlalchemy import SQLAlchemy


basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
DEVELOPMENT = bool(os.environ.get("FLASK_DEVELOPMENT"))


app.config["SQLALCHEMY_DATABASE_URI"] = (
    os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(basedir, 'data.sqlite')}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or "mysecretkey"

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)


from models import List, Note, User

####################################


@app.route("/")
def base():
    if DEVELOPMENT:
        print(f"\n*{'*' * 25}\n*\n* Development mode: {DEVELOPMENT}\n*\n*{'*' * 25}\n")
        return send_from_directory("client/public", "index.html")
    return render_template("index.html")


@app.route("/<path:path>")
def home(path):
    return send_from_directory("client/public", path)


####################################


@app.route("/checkLogin")
def check_login():
    if current_user.is_authenticated:
        print(f"current user: User(id: {current_user.id}, email: {current_user.email})")
        return jsonify(logged_in=True)
    print("No user logged in")
    return jsonify(logged_in=False)


@app.route("/login", methods=["POST"])
def user_login():
    email = request.get_json().get("email")
    password = request.get_json().get("password")
    if not email or not password:
        return jsonify(success=False, message="no email or password supplied")
    user = User.query.filter_by(email=email.lower()).first()
    if user is not None and user.verify_password(password):
        login_user(user)
        return jsonify(success=True)
    return jsonify(success=False, message="login failed")


@app.route("/logout")
@login_required
def user_logout():
    logout_user()
    return jsonify(success=True, message="successfully logged out")


@app.route("/signup", methods=["POST"])
def user_signup():
    email = request.get_json().get("email")
    password = request.get_json().get("password")
    user_exists = User.query.filter_by(email=email.lower()).first()
    if user_exists:
        return jsonify(success=False, message="email already exists")
    if not email:
        return jsonify(success=False, message="must provide an email address")
    user = User(email.lower(), password)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    return jsonify(success=True, message="successfully signed up")


@app.route("/lists")
@login_required
def get_lists():
    lists = List.query.filter_by(user_id=current_user.id).all()
    return jsonify(lists=[list.to_json() for list in lists])


@app.route("/addList", methods=["POST"])
@login_required
def add_list():
    name = request.get_json().get("name")
    if not name:
        return jsonify(success=False, message="must provide a list name"), 400
    user_id = current_user.id
    new_list = List(name, user_id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify(success=True, list=new_list.to_json())


@app.route("/deleteList/<int:list_id>", methods=["DELETE"])
@login_required
def delete_list(list_id):
    user_lists = [list.id for list in current_user.lists]
    if list_id not in user_lists:
        return (
            jsonify(
                success=False,
                message=(
                    "this list does not exist or you are not authorized to take this action"
                ),
            ),
            401,
        )
    Note.query.filter_by(list_id=list_id).delete()
    List.query.filter_by(id=list_id).delete()
    db.session.commit()
    return jsonify(success=True, message=f"list {list_id} deleted")


@app.route("/list/<int:list_id>/notes")
@login_required
def get_notes(list_id):
    query = [list for list in current_user.lists if list.id == list_id]
    if not query:
        return (
            jsonify(
                success=False,
                message=(
                    "this list does not exist or you are not authorized to take this action"
                ),
            ),
            401,
        )
    notes = query[0].notes
    return jsonify(success=True, notes=[note.to_json() for note in notes])


@app.route("/addNote", methods=["POST"])
@login_required
def add_note():
    new_note = request.get_json()
    list_id = new_note.get("list_id")
    body = new_note.get("body")
    print(body, list_id)
    if not list_id or not body:
        return jsonify(success=False, message=("missing note information")), 400
    user_lists = [list.id for list in current_user.lists]
    if list_id not in user_lists:
        return (
            jsonify(
                success=False,
                message=(
                    "this list does not exist or you are not authorized to take this action"
                ),
            ),
            401,
        )
    note = Note.from_json(new_note)
    db.session.add(note)
    db.session.commit()
    return jsonify(success=True, note=note.to_json()), 201


@app.route("/<int:list_id>/deleteNote/<int:note_id>", methods=["DELETE"])
@login_required
def delete_note(list_id, note_id):
    user_lists = [list.id for list in current_user.lists]
    if list_id not in user_lists:
        return (
            jsonify(
                success=False,
                message=(
                    "this list does not exist or you are not authorized to take this action"
                ),
            ),
            401,
        )
    Note.query.filter_by(id=note_id).delete()
    db.session.commit()
    return jsonify(success=True, message=(f"note {note_id} deleted from list {list_id}"))


if __name__ == "__main__":
    app.run(port=3000)
