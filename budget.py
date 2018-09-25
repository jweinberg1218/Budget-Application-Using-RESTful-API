from flask import Flask, render_template
from flask_restful import reqparse, abort, Api, Resource

app = Flask(__name__)
api = Api(app)

app.config.update(dict(SEND_FILE_MAX_AGE_DEFAULT=0))

CATEGORIES = {}
PURCHASES = {}

def abort_if_category_doesnt_exist(category_id):
	if category_id not in CATEGORIES:
		abort(404, message="Category {} doesn't exist".format(category_id))

def abort_if_purchase_doesnt_exist(purchase_id):
	if purchase_id not in PURCHASES:
		abort(404, message="Purchase {} doesn't exist".format(purchase_id))

parser = reqparse.RequestParser()
parser.add_argument('categoryName')
parser.add_argument('categoryLimit')
parser.add_argument('purchaseAmount')
parser.add_argument('purchaseDescription')
parser.add_argument('purchaseDate')
parser.add_argument('purchaseCategory')


@app.route("/")
def root_page():
	return render_template("base.html")

# shows a single category item and lets you delete a category item
class Category(Resource):
	def get(self, category_id):
		abort_if_category_doesnt_exist(category_id)
		return CATEGORIES[category_id]

	def delete(self, category_id):
		abort_if_category_doesnt_exist(category_id)
		del CATEGORIES[category_id]
		return '', 204

	def put(self, category_id):
		args = parser.parse_args()
		category = {'categoryName': args['categoryName'], 'categoryLimit': args['categoryLimit']}
		CATEGORIES[category_id] = category
		return category, 201

# Shows a list of all categories and lets you POST to add new categories
class CategoryList(Resource):
	def get(self):
		return CATEGORIES

	def post(self):
		args = parser.parse_args()
		if CATEGORIES:
			category_id = int(max(CATEGORIES.keys()).lstrip('category')) + 1
		else:
			category_id = 1
		category_id = 'category%i' % category_id
		CATEGORIES[category_id] = {'categoryName': args['categoryName'], 'categoryLimit': args['categoryLimit']}
		return CATEGORIES[category_id], 201

# Shows a single purchase item and lets you delete a purchase item
class Purchase(Resource):
	def get(self, purchase_id):
		abort_if_purchase_doesnt_exist(purchase_id)
		return PURCHASES[purchase_id]

	def delete(self, purchase_id):
		abort_if_purchase_doesnt_exist(purchase_id)
		del PURCHASES[purchase_id]
		return '', 204

	def put(self, purchase_id):
		args = parser.parse_args()
		purchase = {'purchaseAmount': args['purchaseAmount'], 'purchaseDescription': args['purchaseDescription'], 'purchaseDate': args['purchaseDate'], 'purchaseCategory': args['purchaseCategory']}
		PURCHASES[purchase_id] = purchase
		return purchase, 201

# Shows a list of all purchases and lets you POST to add new purchases
class PurchaseList(Resource):
	def get(self):
		return PURCHASES

	def post(self):
		args = parser.parse_args()
		if PURCHASES:
			purchase_id = int(max(PURCHASES.keys()).lstrip('purchase')) + 1
		else:
			purchase_id = 1
		purchase_id = 'purchase%i' % purchase_id
		PURCHASES[purchase_id] = {'purchaseAmount': args['purchaseAmount'], 'purchaseDescription': args['purchaseDescription'], 'purchaseDate': args['purchaseDate'], 'purchaseCategory': args['purchaseCategory']}
		return PURCHASES[purchase_id], 201

##
## Actually setup the API resource routing here
##
api.add_resource(CategoryList, '/categories')
api.add_resource(Category, '/category/<category_id>')
api.add_resource(PurchaseList, '/purchases')
api.add_resource(Purchase, '/purchase/<purchase_id>')

if __name__ == '__main__':
	app.run(debug=True)
