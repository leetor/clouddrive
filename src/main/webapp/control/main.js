var errorEvent = function (response) {
	toastr.error(response.data);
	if (response.status == 401) {
		setTimeout("window.location.href = 'login.html'", 1000)
	}
}

var app = angular.module('mainPageApp', ['angularFileUpload']);
var postCfg = {
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	transformRequest: function (data) {
		return $.param(data);
	}
};

app.directive('fallbackSrc', function () {
	var fallbackSrc = {
		link: function postLink(scope, iElement, iAttrs) {
			iElement.bind('error', function () {
				angular.element(this).attr("src", iAttrs.fallbackSrc);
			});
		}
	}
	return fallbackSrc;
});

// 主面板
app.controller("container", function ($scope, $http) {
	$("[data-toggle='popover']").popover();
	$scope.uploadlist = new Array();
	$scope.downloadlist = new Array();
	// token
	var token = {};
	token.pcdtoken = CookieUtil.getCookie("pcdtoken");
	$scope.token = token;
	$scope.showCtrl = 3;
	$scope.showCtrl = 1;
	// 显示网盘
	$scope.showFileList = function () {
		$scope.showCtrl = 1;
	}
	// 显示传输
	$scope.showTransport = function () {
		$scope.showCtrl = 0;
	}
	// 显示分享
	$scope.showShare = function () {
		$scope.showCtrl = -1;
	}
	//退出登录
	$scope.logout = function () {
		$http.delete("api/login/logout", $scope.$parent.token).then(function success(response) {
			if (response) {
				CookieUtil.delCookie("pcdtoken");
				window.location.href = 'login.html'
			}
		}, errorEvent);
	}
});
// 文件列表
app.controller("filelist", ["$scope", "$http", "FileUploader", function ($scope, $http, FileUploader) {
	var uploader = $scope.uploader = new FileUploader({
		url: 'api/files',
		autoUpload: true,
		removeAfterUpload: false
	});
	//添加上传任务成功
	uploader.onAfterAddingFile = function (fileItem) {
		fileItem.id = new Date().getTime();
		$scope.uploadlist.push(fileItem);
	};
	//上传错误
	uploader.onErrorItem = function (item, response, status, headers) {
		item.errormsg = response;
	}
	// 加载移动modal目录列表
	function moveModalLoadDir() {
		var url = "api/files";
		var movefilepath = $scope.FileModal.path;
		var nowdir = $scope.FileModal.dirul[$scope.FileModal.dirul.length - 1].base64FilePath;
		if (nowdir) {
			url = url + "/" + nowdir + "?accepttype=folder&filterfile=" + movefilepath;
		} else {
			url = url + "?accepttype=folder&filterfile=" + movefilepath;
		}
		$http.get(url, $scope.$parent.token).then(function success(response) {
			if (response) {
				$scope.FileModal.filelist = response.data.result;
			}
		}, errorEvent);
	}

	// 加载指定目录
	function loadDir(requrl) {
		if (requrl) {
			requrl = "api/files/" + requrl;
		} else {
			requrl = "api/files";
		}
		$http.get(requrl, $scope.$parent.token).then(function success(response) {
			if (response) {
				$scope.filelist = response.data.result;
				$scope.selectedFile = null;
			}
		}, errorEvent);
	}
	// 监听页面切换显示
	$scope.$watch("showCtrl", function (showCtrlValue) {
		if (showCtrlValue == 1) {
			loadDir();
			var length = $scope.dirul.length;
			$scope.dirul.splice(1, length);
			$scope.selectedFile = null;
		}
	});
	// 文件列表对话框关闭
	$('#FileModal').on('hidden.bs.modal', function (e) {
		$scope.filename = null;
		$scope.selectedFile = null;
		$scope.FileModal = null
		$scope.shareFile = null;
	});
	// 初始化目录导航
	var navbar = new Array();
	var file = {};
	file.base64FilePath = "";
	file.name = "主目录";
	navbar.push(file);
	$scope.dirul = navbar;
	// 进入指定目录
	$scope.enterDir = function (a) {
		loadDir(a.base64FilePath);
		var file = {};
		file.base64FilePath = a.base64FilePath;
		file.name = a.fileName;
		$scope.dirul.push(file);
	}
	// 返回到指定目录
	$scope.backup = function (li) {
		var index = li.$index;
		var length = $scope.dirul.length;
		$scope.dirul.splice(index + 1, length - index + 1);
		loadDir(li.li.base64FilePath);
	}
	// 文件列表选中
	$scope.select = function (tr) {
		$scope.selectedFile = tr;
	}
	// 文件列表取消选择
	$scope.cancelSelect = function () {
		$scope.selectedFile = null;
	}
	// 移动文件Modal
	$scope.moveFileModal = function () {
		var modal = {};
		modal.title = "移动文件：" + $scope.selectedFile.fileName;
		modal.type = "move";
		modal.path = $scope.selectedFile.base64FilePath;
		modal.dirul = new Array();
		// 初始化移动Modal文件导航
		var file = {};
		file.base64FilePath = "";
		file.fileName = "主目录";
		modal.dirul.push(file);
		$scope.FileModal = modal;
		moveModalLoadDir();
		$("#FileModal").modal();
	}

	$scope.moveModalbackup = function (li) {
		var index = li.$index;
		var length = $scope.FileModal.dirul.length;
		$scope.FileModal.dirul.splice(index + 1, length - index + 1);
		moveModalLoadDir();
	}
	$scope.moveModalEnterDir = function (file) {
		$scope.FileModal.dirul.push(file);
		moveModalLoadDir();
	}
	// 重命名文件Modal
	$scope.renameFileModal = function () {
		var modal = {};
		modal.title = "重命名文件：" + $scope.selectedFile.fileName;
		modal.type = "rename";
		$scope.FileModal = modal;
		$("#FileModal").modal();
	}
	// 删除文件Modal
	$scope.delFileModal = function () {
		var modal = {};
		modal.title = "删除文件：" + $scope.selectedFile.fileName;
		modal.type = "del";
		$scope.FileModal = modal;
		$("#FileModal").modal();
	}
	// 新建文件Modal
	$scope.newFileModal = function () {
		var modal = {};
		modal.title = "新建文件：";
		modal.type = "file";
		$scope.FileModal = modal;
		$("#FileModal").modal();
	}
	// 新建文件夹Modal
	$scope.newDirModal = function () {
		var modal = {};
		modal.title = "新建文件夹：";
		modal.type = "directory";
		$scope.FileModal = modal;
		$("#FileModal").modal();
	}
	// 离线下载
	$scope.addDownloadTask = function () {
		$scope.url = null;
		var modal = {};
		modal.title = "离线下载：";
		modal.type = "download";
		$scope.FileModal = modal;
		$("#FileModal").modal();
	}
	// 文件分享Modal
	$scope.shareFileModal = function () {
		// TODO 完善链接
		$http.post("api/share/" + $scope.selectedFile.base64FilePath, $scope.$parent.token, postCfg).then(function (response) {
			if (response) {
				response.data.result.link = response.data.result.id;
				$scope.shareFile = response.data.result;
				var modal = {};
				modal.title = "分享成功！";
				modal.type = "share";
				$scope.FileModal = modal;
				$("#FileModal").modal();
			}
		}, errorEvent);
	}
	// 文件播放
	$scope.playFile = function () {
		window.open('play.html?url=' + $scope.selectedFile.base64FilePath+"&playtype="+$scope.selectedFile.fileType);
	}
	// 文件下载
	$scope.dlFile = function () {
		window.location.href = 'api/files/' + $scope.selectedFile.base64FilePath + "/download";
	}
	// 上传文件
	$scope.uploadFile = function () {
		$("#file_upload").trigger('click');
	}
	// Modal提交
	$scope.fileModalSubmit = function (modal) {
		var success = function (response) {
			if (response) {
				toastr.info(response.data.resultdesc);
				loadDir($scope.dirul[$scope.dirul.length - 1].base64FilePath);
				$("#FileModal").modal('hide');
			}
		}
		switch (modal.type) {
			case "del":
				$http.delete("api/files/" + $scope.selectedFile.base64FilePath, $scope.$parent.token, postCfg).then(success,
					errorEvent);
				break;
			case "file":
			case "directory":
				if (!$scope.filename) {
					toastr.error("请输入文件（夹）名称！");
					return;
				}
				var newfilename = Base64.encodeURI($scope.filename);
				var nowdir = $scope.dirul[$scope.dirul.length - 1].base64FilePath;
				if (nowdir) {
					$http.post("api/files/" + nowdir + "/" + modal.type + "/" + newfilename, $scope.$parent.token, postCfg).then(success,
						errorEvent);
				} else {
					$http.post("api/files/" + modal.type + "/" + newfilename, $scope.$parent.token, postCfg).then(success,
						errorEvent);
				}
				break;
			case "rename":
				if (!$scope.filename) {
					toastr.error("请输入文件（夹）名称！");
					return;
				}
				var newfilename = Base64.encodeURI($scope.filename);
				$http.patch("api/files/" + $scope.selectedFile.base64FilePath + "/" + newfilename, $scope.$parent.token, postCfg).then(success,
					errorEvent);
				break;
			case "download":
				if (!$scope.url) {
					toastr.error("请输入下载链接！");
					return;
				}
				var url = Base64.encodeURI($scope.url);
				$http.post("api/download/" + url, $scope.$parent.token, postCfg).then(success,
					errorEvent);
				break;
			case "move":
				var nowdir = $scope.FileModal.dirul[$scope.FileModal.dirul.length - 1].base64FilePath;
				var filepath = $scope.selectedFile.base64FilePath;
				$http.put("api/files/" + filepath + "/" + nowdir, $scope.$parent.token, postCfg).then(success,
					errorEvent);
				break;
		}
	}
}]);

// 传输列表
app.controller("transportlist", function ($scope, $http, $interval) {
	var reqFlag = true;

	var p = $interval(function () {
		if (reqFlag) {
			loadDownload();
			reqFlag = false;
		}
	}, 2000);


	// 加载服务端下载任务
	function loadDownload() {
		$http.get("api/download", $scope.$parent.token).then(function success(response) {
			if (response) {
				$scope.$parent.downloadlist = response.data.result;
				reqFlag = true;
			}
		}, function (response) {
			reqFlag = true;
		});
	}
	// 监控下载任务
	$scope.$watch("downloadlist", function (downloadlist) {
		$scope.dllist = downloadlist;
	});
	// 清除上传任务
	$scope.delUpload = function (ts) {
		ts.cancel();
		ts.remove();
		var uploadArray = $scope.$parent.uploadlist;
		for (var i = 0; i < uploadArray.length; i++) {
			if (uploadArray[i].id == ts.id) {
				uploadArray.splice(i, 1);
			}
		}
	}
	var success = function (response) {
		if (response) {
			toastr.info(response.data.resultdesc);
		}
	}
	// 停止下载
	$scope.stopDownload = function (dl) {
		$http.patch("api/download/" + dl.taskid, $scope.$parent.token).then(success, errorEvent);
	}
	// 下载重试
	$scope.retryDownload = function (dl) {
		$http.put("api/download/" + dl.taskid, $scope.$parent.token).then(success, errorEvent);
	}
	// 删除下载
	$scope.delDownload = function (dl) {
		$http.delete("api/download/" + dl.taskid, $scope.$parent.token).then(success, errorEvent);
	}
});
// 分享列表
app.controller("sharelist", function ($scope, $http) {
	function loadShareList() {
		$http.get("api/share", $scope.$parent.token).then(function success(response) {
			if (response) {
				$scope.sharelist = response.data.result;
			}
		}, errorEvent);
	}

	// 监听页面切换显示
	$scope.$watch("showCtrl", function (showCtrlValue) {
		if (showCtrlValue == -1) {
			loadShareList();
		}
	});
	// 取消分享
	$scope.cancelShare = function (file) {
		$http.delete("api/share/" + file.id, $scope.$parent.token).then(function success(response) {
			if (response) {
				toastr.info(response.data.resultdesc);
				loadShareList();
			}
		}, errorEvent);
	}

	// 复制分享连接
	$scope.copyShareLink = function (file) {
		// TODO 完善链接
		new Clipboard('.copy', {
			text: function (trigger) {
				toastr.info("复制到剪切板成功！");
				return "aaaaa";
			}
		});
	}
});
