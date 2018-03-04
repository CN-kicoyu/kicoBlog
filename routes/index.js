var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js')
    multer = require('multer');

module.exports = function(app) {
	var storage = multer.diskStorage({
		destination: function(req,file,cb) {
			cb(null,'./public/images')
		},
		filename: function(req,file,cb) {
			cb(null,file.originalname)
		}
	});
	var upload = multer({
		storage: storage
	});
	app.get('/',function(req,res) {
		var page = parseInt(req.query.p) || 1;
		Post.getTen(null,page,function(err,posts,total) {
			if(err) {
				posts = [];
			}
			res.render('index',{
			    title:'主页',
			    user:req.session.user,
			    posts:posts, 
			    page:page,
			    isFirstPage:(page -1) == 0,
			    isLastPage:((page-1)*10 + posts.length) == total,
			    success:req.flash('success').toString(),
			    error:req.flash('error').toString()
			});
		})
	});
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res) {
		res.render('reg',{
			title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res) {
		var name = req.body.name,
		    password = req.body.password,
		    password_re = req.body['password-repeat'];
 		if(password_re != password) {
 			req.flash('error','两次输入的密码不一致！');
 			return res.redirect('/reg');
 		}
 		/*var md5 = crypto.createHash('md5'),
 		    password = md5.update(req.body.password).digest('hex');*/
 		var newUser = new User({
 			name:name,
 			password:password,
 			email:req.body.email
 		});
 		User.get(newUser.name,function(err,user) {
 			if(err) {
 				req.flash('error',err);
 				return res.redirect('/');
 			}
 			if(user) {
 				req.flash('error','用户已存在！');
 				return res.redirect('/reg');
 			}
 			newUser.save(function(err,user) {
 				if(err) {
 					req.flash('error',err);
 					return res.redirect('/reg');
 				}
 				req.session.user = newUser;
 				req.flash('success','注册成功！');
 				res.redirect('/');
 			})
 		})
	});
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res) {
		res.render('login',{
			title:'登录',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res) {
       /* var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');*/
        User.get(req.body.name,function(err,user) {
        	if(!user) {
        		req.flash('error','用户不存在！');
        		return res.redirect('/login');
        	}
        	if(user.password != req.body.password) {
        		req.flash('error','密码错误！');
        		return res.redirect('/login');
        	}
        	req.session.user = user;
        	req.flash('success','登录成功！');
        	res.redirect('/');
        })
	});
	app.get('/post', checkLogin);
	app.get('/post',function(req,res) {
		res.render('post',{
			title:'发表',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/post', checkLogin);
	app.post('/post',function(req,res) {
		var currentUser = req.session.user,
		    post = new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function(err) {
			if(err) {
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功！');
			res.redirect('/');
		})
	});
	app.get('/logout', checkLogin);
	app.get('/logout',function(req,res) {
		req.session.user = null ;
		req.flash('success','登出成功! ');
		res.redirect('/'); 
	});
	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res) {
		res.render('upload',{
			title:'文件上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/upload',checkLogin);
	app.post('/upload',upload.array('field1',5),function(req,res) {
		req.flash('success','文件上传成功！');
		res.redirect('/upload');
	});
	app.get('/u/:name',function(req,res) {
		var page = parseInt(req.query.p) || 1;
		User.get(req.params.name,function(err,user) {
			if(!user) {
				req.flash('error','用户不存在！');
				return res.redirect('/');
			}
			Post.getTen(user.name,page,function(err,posts,total) {
				if(err) {
					req.flash('error',err);
					return res.redirect('/');
				}
				res.render('user',{
					title:user.name,
					posts:posts,
					page:page,
					isFirstPage:(page - 1) == 0 ,
					isLastPages:((page-1)*10 + posts.length) == total,
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				})
			})
		})
	});
	app.get('/u/:name/:day/:title',function(req,res) {
		Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post) {
			if(err) {
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('article',{
				title:req.params.title,
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			})
		});
	});
	app.post('/u/:name/:day/:title',function(req,res) {
		var date = new Date(),
		    time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() :date.getMinutes());
		var comment = {
			name: req.body.name,
			email:req.body.email,
			website:req.body.website,
			time:time,
			content:req.body.content
		};
		var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
		newComment.save(function(err) {
			if(err) {
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','留言成功！');
			res.redirect('back')
		})
	})      
	app.get('/edit/:name/:day/:title',checkLogin);
	app.get('/edit/:name/:day/:title',function(req,res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post) {
			if(err) {
				req.flash('error',err);
				return res.redirect('back');
			}
			res.render('edit',{
				title:'编辑',
				post:post,
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});
	app.post('/edit/:name/:day/:title',checkLogin);
	app.post('/edit/:name/:day/:title',function(req,res) {
		var currentUser = req.session.user;
		Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err) {
				req.flash('error',err);
				return res.redirect(url);
			}
			req.flash('success','修改成功! ');
			res.redirect(url)
		})
	});
	app.get('/remove/:name/:day/:title',checkLogin);
	app.get('/remove/:name/:day/:title',function(req,res) {
		var currentUser = req.session.user;
		Post.remove(currentUser.name,req.params.day,req.params.title,function(err) {
			if(err) {
				req.flash('error',err);
				return res.redirect('back');
			}
			req.flash('success','删除成功！');
			res.redirect('/');
		})
	})

	function checkLogin(req,res,next) {
		if(!req.session.user) {
			req.flash('error','未登录！');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req,res,next) {
		if(req.session.user) {
			req.flash('error','已登录! ');
			res.redirect('back');
		}
		next();
	}
};