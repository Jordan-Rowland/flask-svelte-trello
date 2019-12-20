from server import db
from models import List, Note


# n = Note.query.all()
# l = List.query.all()


try:
    db.drop_all()
except Exception:
    pass

db.create_all()

# l = List(name="list1")
# n = Note("hello", list_id=1)

# db.session.add(n)
# db.session.add(l)
# db.session.commit()

# n = Note.query.all()
# l = List.query.all()
