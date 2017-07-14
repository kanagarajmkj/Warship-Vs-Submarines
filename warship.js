var containerWidth;
var containerHeight;

var warShipId = 'warShipMain';

//Dimensions
var warShipWidth = 240;
var warShipHeight = 80;

var shipMissileWidth = 13;
var shipMissileHeight = 26;

var submarineWidth = 80;
var submarineHeight = 40;

var subMissileWidth = 10;
var subMissileHeight = 30;

//Sea level
var waterLevelLinePercentage = 20; 
var waterLevelTop;
var waterHeightPercentage = 100 - waterLevelLinePercentage;
var waterHeight;
var $container;
var $warShip;
var subsMovingObjects = new Array();

//Speeds
var subMarineSpeed = 3;
var subMissileSpeed = 5;
var warShipMissileSpeed = 6;
var warShipSpeed = 15;

//Scoring
var gameScore = 0;
var subMissileEscapingPoints = 2;
var subDestroyedPoints = 10;
var warShipLife = 5;

//Level
var gameLevel = 1;
var subsToDestroyForLevelUpgrade = 10;
var noOfSubsDestroyedInCurrentLevel = 0;

//Difficulty
var submarineCount = 5;

//Movement definition
var directions = { Left : 'left', Right : 'right', Top : 'top', Bottom : 'bottom' };

var isGameOn = false;

$(document).ready(function () {
	startGame();
});

class AutonomousMovingItem
{
	constructor(id, movingDirections, currentDirection, intervalOperation, constrainsItemClass, speed, containerRectangle, onMove, onMoveCompleted)
	{
		this.id = id;
		this.speed = speed;
		this.$object = $('#' + id);
		var obj = this.$object;
		var item = this;
		this.Rectangle = new ObjectRectangle(id);
		this.movingDirections = movingDirections;
		this.currentDirection = this.getCurrentDirection(currentDirection);
		this.intervalOperations = new Array();
		this.containerRectangle = containerRectangle;
		this.onMove = onMove;
		this.onMoveCompleted = onMoveCompleted;
		
		this.intervalOperations[0] = setInterval( function () {item.move(item);}, 50);
		if(intervalOperation)
		this.intervalOperations[1] = setInterval( function() { intervalOperation(id);}, getRandomRange(3, 5) * 1000);
	}
	
	getCurrentDirection(currentDirection)
	{
		if(currentDirection)
		 return currentDirection
		else if(this.movingDirections.length == 1)
		{
			return this.movingDirections[0];
		}
		else
		{
			var length = this.movingDirections.length;
			return this.movingDirections[getRandom(length) - 1];
		}
	}
	
	move(Item)
	{
	this.$object = Item.$object;
		var left = getLeftOfAnObject(this.$object);
		var top = getTopOfAnObject(this.$object);
		Item.checkSurrounding(Item);
		if(!Item.currentDirection)
		{
			if(Item.onMoveCompleted)
				Item.onMoveCompleted();
			Item.destroyThis(Item);
		}
		if(this.currentDirection == directions.Left)
			{
				left -= Item.speed;
				setLeftOfAnObject(this.$object, left);
			}
		if(this.currentDirection == directions.Right)
			{
				left += Item.speed;
				setLeftOfAnObject(this.$object, left);
			}
		if(this.currentDirection == directions.Top)
			{
				top -= Item.speed;
				setTopOfAnObject(this.$object, top);
			}
		if(this.currentDirection == directions.Bottom)
			{
				top += Item.speed;
				setTopOfAnObject(this.$object, top);
			}
			if(Item.onMove)
				Item.onMove(Item);
	}
	
	destroyThis(Item)
	{
		Item.$object.remove();
		for(var i=0;i<Item.intervalOperations.length;i++)
			clearInterval(Item.intervalOperations[i]);
	}
	
	checkSurrounding(Item)
	{
		Item.Rectangle = new ObjectRectangle(Item.id);
		if(Item.currentDirection == directions.Left)
		{
			if(Item.Rectangle.left <= Item.containerRectangle.left)
				Item.currentDirection = Item.flipCurrentDirection(Item);
		}
		if(Item.currentDirection == directions.Right)
		{
			if(Item.Rectangle.right >= Item.containerRectangle.right)
				Item.currentDirection = Item.flipCurrentDirection(Item);
		}
		if(Item.currentDirection == directions.Top)
		{
			if(Item.Rectangle.top <= Item.containerRectangle.top)
				Item.currentDirection = Item.flipCurrentDirection(Item);
		}
		if(Item.currentDirection == directions.Bottom)
		{
			if(Item.Rectangle.bottom >= Item.containerRectangle.bottom)
				Item.currentDirection = Item.flipCurrentDirection(Item);
		}
	}
	
	flipCurrentDirection(Item)
	{
		var oppositeDirection = getOppositeDirection(Item.currentDirection);
		if(Item.movingDirections.indexOf(oppositeDirection) > - 1)
			return oppositeDirection;
	}
}

class ObjectRectangle {
	constructor(id, left, top, right, bottom){
		if(id && id.length > 0)
		{
			var $obj = $('#' + id);
			this.left = getLeftOfAnObject($obj);
			this.top = getTopOfAnObject($obj);
			this.right = this.left + $obj.outerWidth();
			this.bottom = this.top + $obj.outerHeight();
		}
		else
		{
			this.left = left;
			this.top = top;
			this.right = right;
			this.bottom = bottom;
		}
	}
}

function checkIntersection(rect1, rect2)
	{
		return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
	}

function getWaterLevelRectangle()
{
	return new ObjectRectangle('', 0, waterLevelTop, containerWidth, containerHeight);
}

function getOppositeDirection(direction)
	{
		switch (direction)
		{
			case directions.Left:
				return directions.Right;
			case directions.Right:
				return directions.Left;
			case directions.Top:
				return directions.Bottom;
			case directions.Bottom:
				return directions.Top;
		}
	}

function getLeftOfAnObject($obj)
{
	return $obj.position().left;
}

function getTopOfAnObject($obj)
{
	return $obj.position().top;
}

function setLeftOfAnObject($obj, left)
{
	$obj.css({'left': left + 'px'});
}

function setTopOfAnObject($obj, top)
{
	$obj.css({'top': top + 'px'});
}

function startGame()
{
	$container = $('.warship-container');
	containerWidth = $container.innerWidth();
	containerHeight = $container.innerHeight();
	waterLevelTop = Math.floor(($container.innerHeight() * waterLevelLinePercentage)/100);
	waterHeight = Math.floor(($container.innerHeight() * waterHeightPercentage)/100);
	createWarShip($container);
	$warShip = $('#' + warShipId);
	isGameOn = true;
	var timeout = false;
	$(window).keydown(function( event ) {
		if(isGameOn)
		{
			var key = event.which;
			shipRect = new ObjectRectangle(warShipId);
			
			if(key == 37)
			{
				if(shipRect.left - warShipSpeed > 0)
					setLeftOfAnObject($warShip, shipRect.left - warShipSpeed);
			}
			if(key == 39)
			{
				if(shipRect.right + warShipSpeed < containerWidth)
					setLeftOfAnObject($warShip, shipRect.left + warShipSpeed);
			}
			if(key == 40)
			{
				if(timeout) return;
				timeout = true;
				triggerShipMissile();
				setTimeout(	function() { 
					timeout = false;
				}, 500);
			}
		}
	});
	
	for(var i =0; i< submarineCount;i++)
	{
		createMovingSubmarine();
	}
}

function createWarShip(container)
{
	var left = Math.floor(container.innerWidth()/2) - Math.floor(warShipWidth/2);
	var top = (waterLevelTop + 50) - warShipHeight; 
	jQuery('<div/>', {
    id: warShipId,
    rel: 'external',
    text: '',
	style: getStyle(left, top, warShipWidth, warShipHeight),
	class:'ship'
	}).appendTo(container);
}

function createSubmarine(container) {
    var idNum = guid();
	var left = getRandom(containerWidth - submarineWidth);
	var waterHeight = containerHeight - waterLevelTop;
	var top = getRandomRange(Math.floor(waterHeight), containerHeight - submarineHeight);
	jQuery('<div/>', {
    id: idNum,
    rel: 'external',
    text: '',
	style: getStyle(left, top, submarineWidth, submarineHeight),
	class:'submarine'
	}).appendTo(container);
	return idNum;
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function createMovingSubmarine()
{
	var subId = createSubmarine($container);
	var dirs = [directions.Left, directions.Right];
	var subSpeed = subMarineSpeed;
	subsMovingObjects[subsMovingObjects.length] = new AutonomousMovingItem(subId, dirs , null, triggerSubMissile, '', subSpeed, getWaterLevelRectangle());
}

function createSubMissile(subId, container)
{
	var idNum = guid();
	var subRect = new ObjectRectangle(subId);
	jQuery('<div/>', {
    id: idNum,
    rel: 'external',
    text: '',
	style: getStyle(subRect.left, subRect.top, subMissileWidth, subMissileHeight),
	class:'submarine-missile'
	}).appendTo(container);
	return idNum;
}

function createShipMissile(container)
{
	var idNum = guid();
	var shipRect = new ObjectRectangle(warShipId);
	var left = shipRect.left + (shipRect.right - shipRect.left)/2
	var top = shipRect.bottom - shipMissileHeight;
	jQuery('<div/>', {
    id: idNum,
    rel: 'external',
    text: '',
	style: getStyle(left, top, shipMissileWidth, shipMissileHeight),
	class:'ship-missile'
	}).appendTo(container);
	return idNum;
}

function triggerSubMissile(subId)
{
	var misId = createSubMissile(subId, $container);
	var misDirs = [directions.Top];
	var misSpeed = subMissileSpeed + (gameLevel - 1);
	new AutonomousMovingItem(misId, misDirs, null, null, '', misSpeed, getWaterLevelRectangle(), function(item) {
		shipRect = new ObjectRectangle(warShipId);
		if(checkIntersection(item.Rectangle, shipRect))
		{ 
			item.destroyThis(item);
			warShipLife -= 1;
			updateShipLife();
			if(warShipLife <= 0 )
				gameOver();
		}
		},
		function () {
			gameScore += subMissileEscapingPoints;
			updateGameScore();
		}		
	 );
}

function triggerShipMissile()
{
	var misId = createShipMissile($container);
	var misDirs = [directions.Bottom];
	var misSpeed = warShipMissileSpeed;
	new AutonomousMovingItem(misId, misDirs, null, null, '', misSpeed, getWaterLevelRectangle(), function(item) {
	var $subs = $('.submarine');
	for(var i = 0;i < $subs.length;i++)
	{
		subRect = new ObjectRectangle($subs[i].id);
		if(checkIntersection(item.Rectangle, subRect))
		{
			sub = getMovingObjectAndIndex(subsMovingObjects, $subs[i].id);
			item.destroyThis(item);
			sub.obj.destroyThis(sub.obj);
			subsMovingObjects[sub.i] = null;
			gameScore += subDestroyedPoints;
			noOfSubsDestroyedInCurrentLevel += 1;
			if(noOfSubsDestroyedInCurrentLevel >= subsToDestroyForLevelUpgrade)
			{
				gameLevel += 1;
				noOfSubsDestroyedInCurrentLevel = 0;
				alert('Score: ' + gameScore + ' Level:' + gameLevel + ' Life' + warShipLife);
				updateGameLevel();
			}
			updateGameScore();
			createMovingSubmarine();
		}
		}
	} );
}

function updateGameScore()
{
	//to be implemented
}

function updateShipLife()
{
	//to be implemented
}

function updateGameLevel()
{
	//to be implemented
}

function gameOver()
{
	// If all the life points are gone
	isGameOn = false;
	for(var i=0;i<subsMovingObjects.length;i++)
	{
		var obj = subsMovingObjects[i];
		if(obj)
		{
		obj.destroyThis(obj);
		subsMovingObjects[i] = null;
		};
	}
	subsMovingObjects = new Array();
}

function getMovingObjectAndIndex(list, id)
{
	for(var i=0;i<list.length;i++)
	{
		var obj = list[i];
		if(obj && obj.id == id)
			return { obj, i };
	}
	return null;
}

function getStyle(left, top, width, height)
{
   return "left:" + left + "px; top:" + top + "px; width:" + width + "px; height:" + height + "px;";
}

function getRandom(max)
{
	return Math.floor((Math.random() * max) + 1);
}

function getRandomRange(min, max)
{
	var val = -1;
	while(val < min)
		val = getRandom(max);
	return val;
}