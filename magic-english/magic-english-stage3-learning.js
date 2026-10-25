// Episode 3 targets are shared by the guide, browser and server evaluator.
const target=(text,korean,required)=>({text,korean,required});
export const STAGE3_PRACTICE={
 s3_class:target('This is my class.','여기는 우리 반이에요.',['this','is','my','class']),
 s3_see_class:target('I can see my class.','우리 교실이 보여요.',['i','can','see','my','class']),
 s3_ready:target('I am ready to go.','갈 준비가 됐어요.',['i','am','ready','to','go']),
 s3_morning:target('Good morning!','좋은 아침이에요!',['good','morning']),
 s3_thanks:target('Thank you!','고마워요!',['thank','you']),
 s3_cat:target('I see a cat.','고양이가 보여요.',['i','see','cat']),
 s3_cat_name:target('The cat is Coco.','이 고양이는 코코예요.',['cat','is','coco']),
 s3_cat_small:target('The cat is small.','고양이가 작아요.',['cat','is','small']),
 s3_come:target('Come here!','이리 와!',['come','here']),
 s3_with_me:target('Please come with me.','나와 함께 와 주세요.',['come','with','me']),
 s3_together:target('Let us try together.','함께 해 보자.',['let','us','try','together']),
 s3_can_do:target('We can do it.','우리는 할 수 있어.',['we','can','do','it']),
 s3_call_coco:target('Come here, Coco!','이리 와, 코코!',['come','here','coco']),
 s3_introduction:target('Hello. I am Gildong.','안녕. 나는 길동이야.',['hello','i','am','gildong']),
 s3_meet:target('Nice to meet you.','만나서 반가워.',['nice','to','meet','you']),
};
export const STAGE3_REQUIRED=['s3_class','s3_cat','s3_come','s3_together','s3_can_do','s3_call_coco'];
