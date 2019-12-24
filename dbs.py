from server import db
from models import List, Note, User



# u = Users.query.all()

# n = Note.query.all()
# l = List.query.all()
# l



def recreate_db():
    try:
        db.drop_all()
    except Exception:
        pass

    db.create_all()

recreate_db()

db.session.add(User("jordanrowland00@gmail.com", "password"))
db.session.commit()

