import datetime

from flask import url_for

from server import db


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
        json_post = {
            "id": self.id,
            "body": self.body,
            "timestamp": self.timestamp,
            # "url": url_for('main.get_post', post_id=self.id)
        }
        return json_post

    @staticmethod
    def from_json(json_note):
        body = json_note.get('body')
        id = json_note.get('id')
        if (
            body is None
            or id == None
            or body == ''
            or id == ''
            ):
            raise Exception('post does not have any body or id')
        return Note(body=body, list_id=id)


class List(db.Model):
    __tablename__ = 'lists'

    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.Text(), index=True, nullable=False)
    notes = db.relationship("Note", backref="list")


    def __init__(self, name):
        self.name = name

    def to_json(self):
        json_list = {
            "id": self.id,
            "name": self.name,
        }
        return json_list

    @staticmethod
    def from_json(json_list):
        name = json_list.get('name')
        id = json_list.get('id')
        if name is None or name == '':
            raise Exception('post does not have any name')
        return List(name=name)
